const map = new URLPattern('https://maps.googleapis.com/maps-api-v3/api/js/:someId/:version/intl/:lang/map.js')
const common = new URLPattern('https://maps.googleapis.com/maps-api-v3/api/js/:someId/:version/intl/:lang/common.js')
const getPlace = new URLPattern('https://*.googleapis.com/$rpc/*')
// const getDirections = new URLPattern('https://maps.googleapis.com/maps/api/js/DirectionsService.Route')
const getDirections = new URLPattern('https://routes.googleapis.com/directions/v2:computeRoutes')
const auth = new URLPattern('https://maps.googleapis.com/maps/api/js/AuthenticationService.Authenticate')

const matcher = ctx => {
  // console.log('ctx.url', ctx.url+'')
  return map.exec(ctx.url) ||
    common.exec(ctx.url) ||
    getPlace.exec(ctx.url) ||
    getDirections.exec(ctx.url) ||
    auth.exec(ctx.url)
}

const get = c => {
  const q = new URLSearchParams({
    cors: JSON.stringify({
      ...c,
      headers: {
        origin: 'http://localhost:5173',
        referer: 'http://localhost:5173/',
      },
      forwardRequestHeaders: false
    })
  })
  return fetch('https://adv-cors.deno.dev/?' + q).then(r => r.text())
}

const get2 = c => {
  console.log('ja')
  const q = new URLSearchParams({
    cors: JSON.stringify({
      ...c,
      headers: {
        origin: 'http://localhost:5173',
        referer: 'http://localhost:5173/',
        'user-agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        accept: '*/*',
      },
      forwardRequestHeaders: !true
    })
  })
  return fetch('https://adv-cors.deno.dev/?' + q).then(r => r.text())
}

const handler = async ctx => {
  console.log('ctx.url', ctx.url+'')

  if (map.exec(ctx.url)) {
    let script = await get({ url: ctx.url })

    script = script.replace(new RegExp(/if\(\w+!==1&&\w+!==2\)/), "if(false)")

    return new Response(script, {
      headers: { 'Content-Type': 'application/javascript' }
    })
  } else if (common.exec(ctx.url)) {
    let script = await get({ url: ctx.url })

    const failureRegex = new RegExp(/;if\(![a-z]+?\).*Failure.*?\}/)
    const someRegex = new RegExp(/(\|\|\(\(\)=>\{\}\);\S+\?\S+?\()/)

    const anotherAppendChildToHeadJSRegex = /\.head;.*src=(.*?);/
    const anotherAppendChildToHeadJS = script.match(anotherAppendChildToHeadJSRegex)

    const googleAPItrustedScriptURL = anotherAppendChildToHeadJS[1]
    const bypassQuotaServicePayload = anotherAppendChildToHeadJS[0]
      .replace(
        googleAPItrustedScriptURL,
        googleAPItrustedScriptURL +
          '.toString().indexOf("QuotaService.RecordEvent")!=-1?"":' +
          googleAPItrustedScriptURL
      )

    script = script
      .replace(failureRegex, ";")
      .replace(someRegex, "$1true||")
      .replace(anotherAppendChildToHeadJSRegex, bypassQuotaServicePayload)

    return new Response(script, {
      headers: { 'Content-Type': 'application/javascript' }
    })
  } else if (getPlace.exec(ctx.url) || getDirections.exec(ctx.url)) {
    const q = new URLSearchParams({
      cors: JSON.stringify({
        url: ctx.url,
        setRequestHeaders: [
          ['referer','http://localhost:5173/'],
          ['accept-encoding', 'br'],
        ]
      })
    })

    let body = null
    try {
      if (ctx.request.body) {
        body = await ctx.request.arrayBuffer()
        const decoder = new TextDecoder()
        const text = decoder.decode(body)
        if (text.includes(location.origin)) {
          body = text.replaceAll(location.origin, 'http://localhost:5173')
        }
      }
    } catch (e) {
      // ignore
    }

    return fetch('https://adv-cors.deno.dev/?' + q, {
      method: ctx.request.method,
      headers: ctx.request.headers,
      body,
    })
  } else if (ctx.url.toString().includes('AuthenticationService.Authenticate')) {
    const callback = ctx.url.searchParams.get('callback')
    const script = `${callback}([1,null,0,null,null,[1]])`
    return new Response(script, {
      headers: { 'Content-Type': 'application/javascript' }
    })
  }
}

export default [ matcher, handler ]
