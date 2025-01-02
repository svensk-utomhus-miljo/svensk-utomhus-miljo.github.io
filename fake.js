import { find } from './util.js'
import staff from './staff.js'

const { AuthorAttribution, Photo } = google.maps.places

/**
 * Makes a fake `google.maps.places.Place` object for testing purposes. The fake
 * place is recognized as a `Place` by the type checker, but does not depend on
 * loading the API. It is *not* recognized as an `instanceof` the `Place`
 * constructor loaded with the API.
 *
 * @param fields - An object of fields of the `Place`. The `id` field is
 *     required and the rest are optional.
 */
function makeFakePlace(fields) {
  return {
    // Fake version of isOpen() simply checks whether the business is
    // operational.
    async isOpen(date) {
      return this.businessStatus === undefined ?
          undefined :
          this.businessStatus === 'OPERATIONAL';
    },

    getNextOpeningTime: async (date) => undefined,
    fetchFields: async (options) => {
      return {place: makeFakePlace(fields)}
    },
    toJSON: () => ({}),
    ...fields,
  };
}

/**
 * Makes a fake `google.maps.places.Photo` object for testing purposes.
 *
 * @param fields - An object containing values of `Photo` fields.
 * @param uri - The URI to return when `getURI()` is called.
 */
function makeFakePhoto(fields, uri) {
  fields.getUrl = (...x) => uri
  return new Photo(fields)
}

/**
 * Makes a fake `google.maps.places.PlacePhoto` object for testing purposes.
 *
 * @param fields - An object containing values of `PlacePhoto` fields.
 * @param uri - The URI to return when `getUrl()` is called.
 */
function makeFakePlacePhoto(fields, uri) {
  return {getUrl: () => uri, ...fields};
}

const SAMPLE_FAKE_PLACE = makeFakePlace({
  addressComponents: [
    { longText: '123', shortText: '123', types: ['street_number'] },
    { longText: 'Main Street', shortText: 'Main St', types: ['route'] },
  ],
  adrFormatAddress: '<span class="street-address">123 Main Street</span>',
  attributions: [
    // { provider: 'Provider 1', providerURI: 'https://www.someprovider.com/1' },
    // { provider: 'Provider 2', providerURI: null },
  ],
  businessStatus: 'OPERATIONAL',
  displayName: 'Värby Allé (Riggen 1)',
  googleMapsURI: '',
  formattedAddress: '123 Main Street',
  iconBackgroundColor: '#123456',
  id: '1234567890',
  internationalPhoneNumber: '+1 234-567-8910',
  location: new google.maps.LatLng(1, 2),
  nationalPhoneNumber: '(234) 567-8910',
  regularOpeningHours: {
    periods: [
      {
        close: {day: 0, hour: 18, minute: 0},
        open: {day: 0, hour: 11, minute: 0},
      },
      {
        open: {day: 1, hour: 12, minute: 30},
        close: {day: 1, hour: 23, minute: 59},
      },
    ],
    weekdayDescriptions: [
      'Monday: Closed',
      'Tuesday: Closed',
      'Wednesday: Closed',
      'Thursday: Closed',
      'Friday: Closed',
      'Saturday: 11:00 AM - 6:00 PM',
      'Sunday: 12:30 PM - 6:00 PM',
    ],
  },
  photos: [
    /*
    makeFakePhoto(
      {
        authorAttributions: [ find(staff, 'jimmy') ],
        heightPx: 1000,
        widthPx: 2000,
      },
      'https://www.dummyimage.com/600x400/000/fff'),
    makeFakePhoto(
      {
        authorAttributions: [ find(staff, 'jimmy') ],
        heightPx: 1000,
        widthPx: 2000,
      },
      'https://www.dummyimage.com/600x400/000/fff'),
    makeFakePhoto(
      {
        authorAttributions: [ find(staff, 'jimmy') ],
        heightPx: 1000,
        widthPx: 2000,
      },
      'https://www.dummyimage.com/600x400/F00/fff'),
    */
  ],
  reviews: [
    {
      authorAttribution: find(staff, 'jimmy'),
      publishTime: new Date(1234567890),
      // rating: 5,
      relativePublishTimeDescription: '1 month ago',
      text: 'it\'s lit!',
      textLanguageCode: 'sv',
    },
    {
      authorAttribution: find(staff, 'fadi'),
      publishTime: new Date(1234567890),
      rating: null,
      relativePublishTimeDescription: '2 months ago',
      text: 'Eyy, jimmy!',
      textLanguageCode: 'sv',
    },
    {
      authorAttribution: find(staff, 'vladan'),
      publishTime: new Date(1234567890),
      rating: 4,
      relativePublishTimeDescription: '3 months ago',
      text: 'Plugga',
      textLanguageCode: 'en',
    },
  ],
  svgIconMaskURI: 'https://maps.gstatic.com/mapfiles/msask.png',
  types: [/* 'restaurant', 'food', 'establishment' */],
  // userRatingCount: 123,
  utcOffsetMinutes: -60,
  websiteURI: 'https://svenskutemiljo.se',
});

/** A sample `google.maps.places.PlaceResult` object for testing purposes. */
const SAMPLE_FAKE_PLACE_RESULT = {
  address_components: [
    {long_name: '123', short_name: '123', types: ['street_number']},
    {long_name: 'Main Street', short_name: 'Main St', types: ['route']},
  ],
  adr_address: '<span class="street-address">123 Main Street</span>',
  business_status: 'OPERATIONAL',
  formatted_address: '123 Main Street',
  formatted_phone_number: '(234) 567-8910',
  geometry: {
    location: new google.maps.LatLng(1, 2),
  },
  html_attributions: [
    '<a href="https://www.someprovider.com/1">Provider 1</a>',
    'Provider 2',
  ],
  icon: 'https://maps.gstatic.com/mapfiles/icon.png',
  icon_background_color: '#123456',
  icon_mask_base_uri: 'https://maps.gstatic.com/mapfiles/mask.png',
  name: 'Place Name',
  international_phone_number: '+1 234-567-8910',
  opening_hours: {
    isOpen: (date) => undefined,
    periods: [
      {
        close: {day: 0, hours: 18, minutes: 0, time: '1800'},
        open: {day: 0, hours: 11, minutes: 0, time: '1100'},
      },
      {
        close: {day: 6, hours: 18, minutes: 0, time: '1800'},
        open: {day: 6, hours: 12, minutes: 30, time: '1230'},
      },
    ],
    weekday_text: [
      'Monday: Closed',
      'Tuesday: Closed',
      'Wednesday: Closed',
      'Thursday: Closed',
      'Friday: Closed',
      'Saturday: 11:00 AM - 6:00 PM',
      'Sunday: 12:30 PM - 6:00 PM',
    ],
  },
  photos:
      [
        makeFakePlacePhoto(
            {
              html_attributions: [
                '<a href="https://www.google.com/maps/contrib/A1">Author A1</a>',
                '<span>Author A2</span>',
              ],
              height: 1000,
              width: 2000,
            },
            'https://www.dummyimage.com/600x400/000/fff'),
        makeFakePlacePhoto(
            {
              html_attributions: [
                '<a href="https://www.google.com/maps/contrib/B1">Author B1</a>',
              ],
              height: 1000,
              width: 2000,
            },
            'https://www.dummyimage.com/600x400/000/fff'),
        makeFakePlacePhoto(
            {
              html_attributions: [],
              height: 1000,
              width: 2000,
            },
            'https://www.dummyimage.com/600x400/000/fff'),
      ],
  place_id: '1234567890',
  plus_code: {
    compound_code: '1234+AB Some Place',
    global_code: 'ABCD1234+AB',
  },
  price_level: 1,
  rating: 4.5,
  reviews: [
    {
      author_name: 'Author 1',
      author_url: 'https://www.google.com/maps/contrib/1/reviews',
      language: 'en',
      profile_photo_url: 'https://www.dummyimage.com/600x400/000/fff',
      // rating: 5,
      // relative_time_description: '1 month ago',
      text: 'it\'s lit!',
      time: 1234567890,
    },
    {
      author_name: 'Author 2',
      author_url: 'https://www.google.com/maps/contrib/2/reviews',
      language: 'es',
      profile_photo_url: 'https://www.dummyimage.com/600x400/000/fff',
      rating: undefined,
      relative_time_description: '2 months ago',
      text: '¡Que bacano!',
      time: 1234567890,
    },
    {
      author_name: 'Author 3',
      author_url: undefined,
      language: 'en',
      profile_photo_url: 'https://www.dummyimage.com/600x400/000/fff',
      rating: 4,
      relative_time_description: '3 months ago',
      text: '',
      time: 1234567890,
    },
  ],
  types: ['restaurant', 'food', 'establishment'],
  url: 'https://maps.google.com/',
  // user_ratings_total: 123,
  utc_offset_minutes: -480,
  website: 'https://www.mywebsite.com/',
}

async function makePlaceFromMarker (marker, relatedMarkers) {
  const images = await Promise.all(relatedMarkers
    .map(e => e.data.images)
    .flat()
    .filter(Boolean)
    .map(uuid =>
      supabase.rpc("storage_object_get_path", { object_id: uuid })
        .then(res => `https://ufvhoqbeacsvboztiwyp.supabase.co/storage/v1/object/public/images/${res.data}`)
    ))

  return makeFakePlace({
    displayName: marker.data.name,
    id: String(marker.data.id),
    location: marker.position,
    // addressComponents: [
    //   { longText: '123', shortText: '123', types: ['street_number'] },
    //   { longText: 'Main Street', shortText: 'Main St', types: ['route'] },
    // ],
    // adrFormatAddress: '<span class="street-address">123 Main Street</span>',
    // attributions: [
    //   // { provider: 'Provider 1', providerURI: 'https://www.someprovider.com/1' },
    //   // { provider: 'Provider 2', providerURI: null },
    // ],
    businessStatus: 'OPERATIONAL',
    // googleMapsURI: '',
    // formattedAddress: '123 Main Street',
    // iconBackgroundColor: '#123456',
    // internationalPhoneNumber: '+1 234-567-8910',
    // nationalPhoneNumber: '(234) 567-8910',
    // regularOpeningHours: {
    //   periods: [
    //     {
    //       close: {day: 0, hour: 18, minute: 0},
    //       open: {day: 0, hour: 11, minute: 0},
    //     },
    //     {
    //       open: {day: 1, hour: 12, minute: 30},
    //       close: {day: 1, hour: 23, minute: 59},
    //     },
    //   ],
    //   weekdayDescriptions: [
    //     'Monday: Closed',
    //     'Tuesday: Closed',
    //     'Wednesday: Closed',
    //     'Thursday: Closed',
    //     'Friday: Closed',
    //     'Saturday: 11:00 AM - 6:00 PM',
    //     'Sunday: 12:30 PM - 6:00 PM',
    //   ],
    // },
    photos: images.map(uri => makeFakePhoto({
        authorAttributions: [
          // new AuthorAttribution(find(staff, 'jimmy'))
        ],
        heightPx: 0,
        widthPx: 0,
      },
      uri
    )),
    // reviews: [
    // ],
    // svgIconMaskURI: 'https://maps.gstatic.com/mapfiles/msask.png',
    // types: [/* 'restaurant', 'food', 'establishment' */],
    // // userRatingCount: 123,
    // utcOffsetMinutes: -60,
    // websiteURI: 'https://svenskutemiljo.se',
  })
}

export {
  makeFakePlace,
  makeFakePhoto,
  makeFakePlacePhoto,
  SAMPLE_FAKE_PLACE,
  SAMPLE_FAKE_PLACE_RESULT,
  makePlaceFromMarker
}