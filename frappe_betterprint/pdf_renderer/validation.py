import os
import re


def validate(data_dict, validators):
    errors = []
    if data_dict is None or validators is None:
        errors.append("Invalid input data")
        return errors

    for key in validators:
        if key not in data_dict:
            errors.append(f"Missing key: {key}")
        else:
            for method in validators[key]:
                if not method(data_dict[key]):
                    errors.append(f"Invalid value for key: {key}")
    return errors


def is_valid_pdf_filepath(filepath: str) -> bool:
    """Validate if the given path is a valid pdf filepath.
    Doesn't check if the path exists"""
    try:
        if not os.path.isabs(filepath) or os.path.isdir(filepath):
            return False

        if not filepath.endswith(".pdf"):
            return False

        return True
    except Exception as e:
        return False


def is_valid_url(url):
    """Checks if the url is a valid url which can be used for samesite origin"""
    if type(url) is not str:
        return False

    check = r"(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})"

    regex = re.compile(check, re.IGNORECASE)
    return re.match(regex, url) is not None


def is_valid_string(string):
    return type(string) is str
