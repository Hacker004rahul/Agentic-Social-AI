from inspect import isawaitable


async def find_many(collection, query=None, projection=None, *, sort=None, limit=None):
    cursor = collection.find(query or {}, projection)
    if isawaitable(cursor):
        cursor = await cursor

    if sort:
        key, direction = sort
        cursor = cursor.sort(key, direction)

    if limit is not None and hasattr(cursor, "limit"):
        cursor = cursor.limit(limit)

    if hasattr(cursor, "to_list"):
        size = limit or 1000
        return await cursor.to_list(size)

    items = list(cursor)
    return items[:limit] if limit is not None else items
