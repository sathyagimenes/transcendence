import traceback
from django.core.exceptions import ValidationError
from django.http import HttpRequest
from django.urls import path

from settings.http import http


def wrapCallback(method: str, callback):
    def wrapped(request: HttpRequest, **kwargs):
        try:
            if request.method != method:
                return http.MethodNotAllowed()
            return callback(request, **kwargs)
        except ValidationError as e:
            if hasattr(e, "error_dict"):
                return http.UnprocessableEntity({"error": e.message_dict})
            else:
                return http.UnprocessableEntity({"error": {"_errors": e.messages}})
        except ValueError as e:
            if not isinstance(e.args[0], str):
                return http.BadRequest({"error": e.args[0]})
            else:
                return http.BadRequest({"error": {"_errors": e.args[0]}})
        except Exception as e:
            traceback.print_exception(e)
            return http.InternalServerError(
                {"error": {"_errors": traceback.format_exception_only(e)}}
            )

    return wrapped


def GET(_path: str, callback):
    return path(_path, wrapCallback("GET", callback))


def POST(_path: str, callback):
    return path(_path, wrapCallback("POST", callback))


def DELETE(_path: str, callback):
    return path(_path, wrapCallback("DELETE", callback))


def PUT(_path: str, callback):
    return path(_path, wrapCallback("PUT", callback))
