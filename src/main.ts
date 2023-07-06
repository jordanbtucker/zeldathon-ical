import {mkdir, writeFile} from 'fs/promises'
import {dirname} from 'path'
import {fetch} from 'cross-fetch'
import {graphQLEndpoint, apiKey, eventID, eventName, outFile} from './config'

type Segment = {
  id: string
  name: string
  start_date: string
  stop_date: string
  updatedAt: string
}

type Schedule = {
  items: Segment[]
}

type Event = {
  schedule: Schedule
}

type EventList = {
  items: Event[]
}

type EventData = {
  listEvents: EventList
}

type ResBody = {
  data: EventData
}

export async function main(): Promise<void> {
  let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//jordanbtucker//zeldathon-ical//EN
CALSCALE:GREGORIAN
X-WR-CALNAME:${eventName}
X-PUBLISHED-TTL:PT15M
`

  const reqBody = {
    query: `query ListEvents($id: ID) {
    listEvents(id: $id) {
      items {
        schedule {
          items {
            id
            name
            start_date
            stop_date
            updatedAt
          }
          nextToken
        }
      }
    }
  }`,
    variables: {
      id: eventID,
    },
  }

  const res = await fetch(graphQLEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(reqBody),
  })

  const resBody = (await res.json()) as ResBody
  const {items} = resBody.data.listEvents.items[0].schedule
  items.sort(sortBy(item => item.start_date))

  for (const {id, name, start_date, stop_date, updatedAt} of items) {
    ical += `BEGIN:VEVENT
DTSTART:${formatDate(start_date)}
DTEND:${formatDate(stop_date)}
DTSTAMP:${formatDate(updatedAt)}
UID:${id}
SUMMARY:${name}
CLASS:PUBLIC
END:VEVENT
`
  }

  ical += 'END:VCALENDAR'

  ical = ical.replace(/\r\n|\r|\n/, '\r\n')

  await mkdir(dirname(outFile), {recursive: true})
  await writeFile(outFile, ical)
}

export function sortBy<T, U>(
  selector: (item: T) => U,
  {isDescending = false} = {},
): (a: T, b: T) => number {
  return (a: T, b: T) => {
    const x = selector(a)
    const y = selector(b)
    return (x < y ? -1 : x > y ? 1 : 0) * (isDescending ? -1 : 1)
  }
}

function formatDate(date: Date | string): string {
  date = new Date(date)
  const dateParts = [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  ]
  const timeParts = [
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  ]
  const parts = [
    dateParts.map(padDatePart).join(''),
    'T',
    timeParts.map(padDatePart).join(''),
    'Z',
  ]

  return parts.join('')
}

function padDatePart(part: number): string {
  return part.toString().padStart(2, '0')
}
