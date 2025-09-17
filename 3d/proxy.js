const map = new URLPattern('https://maps.googleapis.com/maps-api-v3/api/js/:someId/:version/intl/:lang/map.js')
const common = new URLPattern('https://maps.googleapis.com/maps-api-v3/api/js/:someId/:version/intl/:lang/common.js')
const getPlace = new URLPattern('https://places.googleapis.com/$rpc/google.maps.places.v1.Places/GetPlace')
const auth = new URLPattern('https://maps.googleapis.com/maps/api/js/*')

const matcher = ctx => {
  return map.exec(ctx.url) || common.exec(ctx.url) || getPlace.exec(ctx.url) || auth.exec(ctx.url)
}

const get = c => {
  const q = new URLSearchParams({
    cors: JSON.stringify({
      ...c,
      forwardRequestHeaders: false
    })
  })
  return fetch('https://adv-cors.deno.dev/?' + q).then(r => r.text())
}

const handler = async ctx => {
  if (map.exec(ctx.url)) {
    let script = await get({ url: ctx.url })

    var unknownStatusRegex = /const\s+(\w+)\s*=.*?;/g;
    var unknownStatusMatch = script.match(unknownStatusRegex) || []

    for (let i = 0; i < unknownStatusMatch.length; i++) {
      if (unknownStatusMatch[i].includes('getStatus')) {
        script = script.replace(
          unknownStatusMatch[i],
          unknownStatusMatch[i].replace(/=.*/, '=1;')
        )
        break
      }
    }

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
  } else if (getPlace.exec(ctx.url)) {
    const q = new URLSearchParams({
      cors: JSON.stringify({
        url: ctx.url,
      })
    })

    return fetch('https://adv-cors.deno.dev/?' + q, {
      method: ctx.request.method,
      headers: ctx.request.headers,
      body: ctx.request.body ? await ctx.request.arrayBuffer() : null,
    }).then(r => r.text())
  }

  if (ctx.url.toString().includes('AuthenticationService.Authenticate')) {
    const callback = ctx.url.searchParams.get('callback')
    const script = `${callback}([1,null,0,null,null,[1]])`
    return new Response(script, {
      headers: { 'Content-Type': 'application/javascript' }
    })
  }

  return

  const url = new URL('/api/cors', import.meta.url)
  url.searchParams.set('url', ctx.url)

  return fetch(url, {
    method: ctx.request.method,
    headers: ctx.request.headers,
    body: ctx.request.body ? await ctx.request.arrayBuffer() : null,
  })
}

export default [ matcher, handler ]