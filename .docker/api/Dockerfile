FROM python

RUN apt-get update && apt-get install -y gettext openssl

WORKDIR /usr/src/app
COPY application/requirements.txt ./application/
RUN pip install --upgrade pip && pip install -r application/requirements.txt
COPY . .
WORKDIR /usr/src/app/application

EXPOSE 8000

RUN chmod +x ../.docker/api/entrypoint.sh

ENTRYPOINT [ "bash", "../.docker/api/entrypoint.sh" ]
