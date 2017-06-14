#/bin/sh
if [ ! -p "/tmp/pianobar" ]; then
	mkfifo /tmp/pianobar
fi

ps cax | grep pianobar > /dev/null
if [ $? -eq 0 ]; then
  echo ""
else
  echo "Not running" > $HOME/nowplaying
fi

if [ $1 = "working" ];then
  echo "working"
elif [ $1 = "start" ];then
  pianobar
elif [ $1 = "stop" ];then
  killall pianobar
else
  echo $1 > /tmp/pianobar
fi
