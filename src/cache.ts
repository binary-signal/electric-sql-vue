import { Shape, ShapeStream } from '@electric-sql/client'
import type { Row, ShapeStreamOptions } from '@electric-sql/client'

const streamCache = new Map<string, ShapeStream<any>>()
const shapeCache = new Map<ShapeStream<any>, Shape<any>>()

function sortedReplacer(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    )
  }
  return value
}

export function sortedOptionsHash<T extends Row = Row>(
  options: ShapeStreamOptions<T>,
): string {
  return JSON.stringify(options, sortedReplacer)
}

export function getShapeStream<T extends Row = Row>(
  options: ShapeStreamOptions<T>,
): ShapeStream<T> {
  const hash = sortedOptionsHash(options)
  const existing = streamCache.get(hash)

  if (existing) {
    return existing as ShapeStream<T>
  }

  const stream = new ShapeStream<T>(options)
  streamCache.set(hash, stream)

  stream.options.signal?.addEventListener('abort', () => {
    streamCache.delete(hash)
  })

  return stream
}

export function getShape<T extends Row = Row>(
  shapeStream: ShapeStream<T>,
): Shape<T> {
  const existing = shapeCache.get(shapeStream)

  if (existing) {
    return existing as Shape<T>
  }

  const shape = new Shape<T>(shapeStream)
  shapeCache.set(shapeStream, shape)

  return shape
}

export async function preloadShape<T extends Row = Row>(
  options: ShapeStreamOptions<T>,
): Promise<Shape<T>> {
  const stream = getShapeStream<T>(options)
  const shape = getShape<T>(stream)
  await shape.rows
  return shape
}
