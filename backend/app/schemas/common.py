from pydantic.alias_generators import to_camel


def camel_config() -> dict:
    return {
        "alias_generator": to_camel,
        "populate_by_name": True,
    }
