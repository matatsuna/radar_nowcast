FROM python:3

WORKDIR /usr/src/app

RUN /bin/cp -f /usr/share/zoneinfo/Asia/Tokyo /etc/localtime

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

RUN apt-get update
RUN apt-get install -y \
    wget \
    imagemagick 

COPY . .

CMD [ "python", "./radarnowcast.py" ]