import * as OneSignal from 'onesignal-node'

const client = new OneSignal.Client(
  process.env.ONESIGNAL_APP_ID,
  process.env.ONESIGNAL_APP_KEY
)

export default async function createNotification ({ content }) {
  const notification = {
    contents: {
      en: content,
      es: content
    },
    included_segments: ['Subscribed Users']
    // filters: [{ field: "tag", key: "level", relation: ">", value: 10 }],
  }

  try {
    const response = await client.createNotification(notification)
    return response.body.id
  } catch (e) {
    if (e instanceof OneSignal.HTTPError) {
      // When status code of HTTP response is not 2xx, HTTPError is thrown.
      console.log(e.statusCode)
      console.log(e.body)
    }
  }
}
