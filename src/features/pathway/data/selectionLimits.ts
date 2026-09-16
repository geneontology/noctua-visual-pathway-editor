/**
 * How many activities a single Copy or Delete may cover.
 *
 * Both go to Minerva as one m3Batch call, and a large batch is slow enough to
 * look hung from the canvas — so the editor holds the line here rather than
 * handing the server a selection it will struggle with.
 */
export const MAX_BULK_NODES = 13
