# -*- coding: utf-8 -*-

from twitter import *
import datetime
import time
from datetime import datetime, timedelta
import os
import urllib.request
import subprocess
from glob import glob
from config import *

todaydetail = datetime.today()

today = datetime.today()
today = today - timedelta(hours=1)
today = today - timedelta(minutes=todaydetail.minute % 5)
for time in range(0, 12):
    filename = str(today.strftime("%Y%m%d%H%M")) + "-00.png"
    url = "http://www.jma.go.jp/jp/radnowc/imgs/radar/206/" + filename
    urllib.request.urlretrieve(url, './' + filename)
    today = today + timedelta(minutes=5)


today = datetime.today()
today = today - timedelta(minutes=(5 + todaydetail.minute % 5))
for time in range(1, 12):
    filename = str(today.strftime("%Y%m%d%H%M")) + \
        "-" + '{0:02d}'.format(time) + '.png'
    url = "http://www.jma.go.jp/jp/radnowc/imgs/nowcast/206/" + filename
    urllib.request.urlretrieve(url, './' + filename)


subprocess.check_output(["convert", "-delay", "50", "*.png", "output.gif"])
print(os.listdir(os.getcwd()))

t = Twitter(auth=OAuth(AT, AS, CK, CS))


pic = str("./output.gif")
with open(pic, "rb") as image_file:
    image_data = image_file.read()
pic_upload = Twitter(domain='upload.twitter.com', auth=OAuth(AT, AS, CK, CS))
id_img1 = pic_upload.media.upload(media=image_data)["media_id_string"]
status = todaydetail.strftime("%Y/%m/%d %H:%M")
t.statuses.update(status=status, media_ids=",".join([id_img1]))


files = glob("*.png")
for filepath in files:
    os.remove(filepath)
os.remove("output.gif")
