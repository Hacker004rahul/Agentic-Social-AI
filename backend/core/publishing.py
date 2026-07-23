from datetime import datetime, timezone


KNOWN_SCHEDULE_FORMATS = (
    "%Y-%m-%d %I:%M %p",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d %H:%M",
)


def parse_publish_datetime(value):
    if not value:
        return None

    if isinstance(value, datetime):
        dt = value
    else:
        text = str(value).strip()
        if not text:
            return None

        normalized = text.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(normalized)
        except ValueError:
            dt = None

        if dt is None:
            for fmt in KNOWN_SCHEDULE_FORMATS:
                try:
                    dt = datetime.strptime(text, fmt)
                    break
                except ValueError:
                    continue

        if dt is None:
            return None

    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)

    return dt


def format_best_time(value):
    dt = parse_publish_datetime(value)
    if dt is None:
        return "Manual slot"
    return dt.strftime("%I:%M %p")
