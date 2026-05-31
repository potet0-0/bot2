import subprocess
import os
import time

def run_bot():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    bot_path = os.path.join(script_dir, 'bot.js')

    while True:
        print('[*] Starting bot...')
        proc = subprocess.Popen(
            ['node', bot_path],
            cwd=script_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        for line in proc.stdout:
            print(line, end='')

        proc.wait()
        print('[!] Bot stopped. Restarting in 5s...')
        time.sleep(5)

if __name__ == '__main__':
    run_bot()
