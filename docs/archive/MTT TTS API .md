# MTT TTS API 完整文档

本文档整合了摩尔线程（MTT）提供的三种 TTS（文本转语音）服务的完整 API 文档，包括：

1. **AIBook 端上 TTS 运行说明** - 基于端上轻量级工具包的本地 TTS 推理
2. **流式语音合成 WebSocket API** - 支持实时流式合成的 WebSocket 接口
3. **TTS 非流式合成 HTTP 接口** - 简单的 HTTP POST 请求接口

---

## 目录

- [1. AIBook 端上 TTS 运行说明](#1-aibook-端上-tts-运行说明)
  - [1.1 程序模型包](#11-程序模型包)
  - [1.2 内部文件说明](#12-内部文件说明)
  - [1.3 模型音色](#13-模型音色)
  - [1.4 Python 环境依赖](#14-python-环境依赖)
  - [1.5 完整示例](#15-完整示例)
- [2. 流式语音合成 WebSocket API](#2-流式语音合成-websocket-api)
  - [2.1 接口地址](#21-接口地址)
  - [2.2 TTS 音色列表](#22-tts-音色列表)
  - [2.3 接口说明](#23-接口说明)
  - [2.4 基础参数说明](#24-基础参数说明)
  - [2.5 流式参数说明](#25-流式参数说明)
  - [2.6 调用示例代码](#26-调用示例代码)
- [3. TTS 非流式合成 HTTP 接口](#3-tts-非流式合成-http-接口)
  - [3.1 接口地址](#31-接口地址)
  - [3.2 TTS 音色列表](#32-tts-音色列表)
  - [3.3 相关参数](#33-相关参数)
  - [3.4 调用示例](#34-调用示例)

---

## 1. AIBook 端上 TTS 运行说明

### 1.1 使用说明

基于端上语音合成轻量级工具包进行 TTS 模型推理。

### 1.2 程序模型包

**公网下载地址：**
```
https://mt-vaas-web.tos-cn-beijing.volces.com/tts/litetts/mt_litetts_v4d.tar
```

### 1.3 内部文件说明

- **推理脚本：** `mt_litetts/inference_zh.py`
- **模型位置：** `mt_litetts/serving_models/litetts_v4d/`
- **使用方式详见：** `mt_litetts/README.md` 或下文"完整示例"

### 1.4 模型音色

- **MT TTS 精品音色：** 程小可

### 1.5 Python 环境依赖

- Python >= 3.8
- 安装依赖库：
  - 详见 `requirements.txt` 文件
  - 执行 `pip install -r requirements.txt`

### 1.6 完整示例

```bash
# 基于 conda 部署 python 环境（如已有稳定 python 环境可跳过）
# 下载安装 Miniforge（社区版，适合 ARM64 / aarch64）
# 官方说明：https://github.com/conda-forge/miniforge
# 下载最新 Miniforge3（Linux aarch64）
curl -L -O https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-aarch64.sh
# 安装
chmod +x Miniforge3-Linux-aarch64.sh
./Miniforge3-Linux-aarch64.sh

# 创建 python(3.8.20) 环境
source ~/.bashrc && conda create -n tts python==3.8.20
conda activate tts

# 下载解压程序模型包
wget https://mt-vaas-web.tos-cn-beijing.volces.com/tts/litetts/mt_litetts_v4d.tar
tar -xvf mt_litetts_v4d.tar && cd mt_litetts

# 查看目录结构
ls
# 输出示例：
# attentions.py  configs        fig        inference.ipynb  LICENSE    mel_processing.py
# modules.py     pqmf.py        __pycache__ README_opensource.md  serving_models  stft.py
# train_latest.py  utils.py  commons.py  data_utils.py  filelists  inference_zh.py
# losses.py  models.py  monotonic_align  preprocess.py  README.md  requirements.txt
# stft_loss.py  text  transforms.py

# 安装相关依赖库
pip install -r requirements.txt
# (如果下载较慢考虑加上 -i https://mirrors.aliyun.com/pypi/simple)

# 开始合成
python inference_zh.py "轻轻的，我走了，正如我轻轻的来"
# 输出信息：
# 1、输入待合成文本：[轻轻的，我走了，正如我轻轻的来]
# 2、加载模型：[serving_models/litetts_v4d/G_280000.pth]
# ....
# 3、模型完成加载
# 4、开始合成...
# 5、完成合成
# 6、合成音频保存至: [./audio.wav]
```

---

## 2. 流式语音合成 WebSocket API

### 2.1 接口地址

**外网访问地址：**
```
wss://aibook-api.mthreads.com:32414/api/v2/tts/stream_generate
```

> **注意：** 访问令牌（Access Token）请联系我们获取。联系方式：
> - meng.cai@mthreads.com
> - ye.wang@mthreads.com

### 2.2 TTS 音色列表

**体验 demo：** https://voice.mthreads.com/

| 音色 | voice_name | 性别 | 备注 |
|------|-----------|------|------|
| 程小可 | AIBC006_llm | 女 | 大模型音色 |
| 程小清 | AIBF004_llm | 女 | 大模型音色 |
| 程小新 | AIBF105_llm | 女 | 大模型音色 |
| 程小艾 | AIBF111_llm | 女 | 大模型音色 |
| 程小曲 | AIBF001_llm | 女 | 大模型音色 |
| 程小园 | AIBF002_llm | 女 | 大模型音色 |
| 程小苏 | AIBF003_llm | 女 | 大模型音色 |
| 程小迪 | AIBM107_llm | 男 | 大模型音色 |
| 程小春 | AIBM115_llm | 男 | 大模型音色 |
| 程小虎 | AIBM101_llm | 男 | 大模型音色 |
| 程小帅 | AIBM103_llm | 男 | 大模型音色 |
| 晓凌 | LYG1004_llm | 女 | 大模型音色 |
| 穆莎 | SSB3001_llm | 女 | 大模型音色 |
| 米塔 | SSB3002_llm | 女 | 大模型音色 |
| 晓柒 | LYG3001_llm | 男 | 大模型音色 |
| BabyX | WSH0001_llm | 男 | 大模型音色 |
| BoyTen | WSH0002_llm | 男 | 大模型音色 |
| 程小可(lite) | AIBC006 | 女 | |
| 程小曲(lite) | AIBF001 | 女 | |
| 小美(lite) | NYS0001 | 女 | |
| 小雅(lite) | NYS0002 | 女 | |
| 穆莎(lite) | SSB3001 | 女 | |
| 米塔(lite) | SSB3002 | 女 | |
| 晓凌(lite) | LYG1004 | 女 | |
| 晓柒(lite) | LYG3001 | 男 | |
| BabyX(lite) | babyx | 男 | |
| BoyTen(lite) | boyten | 男 | |

### 2.3 接口说明

#### 2.3.1 单句流式合成

**使用说明：**
- client 单次发送请求信息，server 流式返回一到多条返回信息

**注意事项：**
- 支持 SSML 输入
- websocket 单次连接仅支持单次合成（返回时间戳为连续数值），若需要合成多次，则需要多次建立连接

#### 2.3.2 流式文本合成：文本大模型实时生成场景

**使用说明：**
流式文本语音合成基于文本持续输入的应用场景进行测试，该接口可以面向大语言模型逐字输入的场景持续输出合成音频，极大地提升了交互体验，减少了用户等待时间，又能同时兼顾在连续文本输入中合成语音效果的上下文连贯性、韵律风格一致性。

**注意事项：**
- 不支持 SSML 输入
- websocket 单次连接仅支持单次合成（返回时间戳为连续数值），如果需要重置时间戳，需要重新建立连接
- 在调用上游就已经确定了全部文本时不建议使用本接口：由于流式文本接口需要维护额外的文本缓冲，整体合成时延会略高于单向流式合成

### 2.4 基础参数说明

#### 2.4.1 发送请求 - 字段说明

| 参数 | 类型 | 层级 | 必须 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| access_token | String | 1 | ✓ | | 目前未生效，填写默认值：default_token |
| cluster | String | 1 | ✓ | | 当前请求使用的算法集群，不同集群支持不同音色，mt_tts / mt_llm_tts |
| input | Dict | 1 | ✓ | | 内容相关配置 |
| text | String | 2 | ✓ | | 待合成文本，文本内容必须采用 UTF-8 编码，长度不超过 300 个字符（英文字母之间需要添加空格） |
| text_type | String | 2 | | plain | plain / ssml, 默认为 plain |
| enable_subtitle | Boolean | 2 | | false | 开启字级别时间戳（开启之后大模型音色首包 latency 会变高） |
| enable_phoneme_timestamp | Boolean | 2 | | false | 开启音素级别时间戳（开启之后大模型音色首包 latency 会变高） |
| voice_config | Dict | 1 | ✓ | | 音色相关配置 |
| voice_name | String | 2 | ✓ | | 音色名称 |
| audio_config | Dict | 1 | | | 音频相关配置 |
| speed_ratio | Float | 2 | | 1 | 语速，[0.2,3]，默认为 1，通常保留一位小数即可（大模型音色不支持） |
| volume_ratio | Float | 2 | | 1 | 音量，[0.1, 3]，默认为 1，通常保留一位小数即可（大模型音色不支持） |
| pitch_ratio | Float | 2 | | 1 | 音高，[0.1, 3]，默认为 1，通常保留一位小数即可（大模型音色不支持） |

#### 2.4.2 请求示例

```json
{
  "access_token": "XXXXX",
  "cluster": "mt_tts",
  "input": {
    "text": "摩尔线程语音合成",
    "text_type": "plain",
    "enable_subtitle": true,
    "enable_phoneme_timestamp": true
  },
  "voice_config": {
    "voice_name": "LYG1004",
    "emotion": "happy",
    "language": "cn"
  },
  "audio_config": {
    "encoding": "pcm",
    "sample_rate": 22050,
    "compression_rate": 1,
    "bits": 16,
    "channel": 1,
    "speed_ratio": 1.0,
    "volume_ratio": 1.0,
    "pitch_ratio": 1.0
  }
}
```

#### 2.4.3 返回信息 - 字段说明

| 字段 | 含义 | 层级 | 格式 | 备注 |
|------|------|------|------|------|
| task_id | 当前 session 的 id | 1 | string | 服务端随机生成 |
| status | 请求状态码 | 1 | int | 错误码，参考下方说明 |
| status_text | 请求状态信息 | 1 | string | 错误信息 |
| is_final | 请求音频是否合成完成 | 1 | boolean | 在流式版本中用到 |
| data | 合成音频 | 1 | string | 返回的音频数据，base64 编码 |
| addition | 额外信息 | 1 | string | 额外信息父节点 |
| duration | 音频时长 | 2 | int | 返回音频的长度，单位 ms |
| subtitles | 字幕/时间戳信息 | 2 | List | 包含字级别和音素级别的时间戳信息，以字级别时间戳为单元的列表 |

#### 2.4.4 状态码

| 错误码 | 含义 | 举例 | 建议处理 |
|--------|------|------|----------|
| 1000 | 请求正确 | 正常合成 | 正常处理 |
| 2000 | 请求参数无效 | 请求参数缺失必需字段 / 字段值无效 | 检查调用逻辑 |
| 2001 | 无效文本 | 参数有误或者文本为空、文本与语种不匹配、文本只含标点 | 检查参数 |
| 2002 | 输入配置错误 | 无效文本类型/在文本流式场景下用 ssml | 检查 input 参数 |
| 2003 | 音色配置错误 | 选择的音色不存在/音色使用错误 | 检查 voice_config 参数 |
| 2004 | 音频配置错误 | 无效音频类型指定 | 检查 audio_config 参数 |
| 2005 | 集群配置错误 | 无效集群指定 | 检查 cluster 参数 |
| 3000 | 服务内部错误 | 服务/网络/资源异常 | 重试 |

#### 2.4.5 返回示例

```json
{
  "task_id": "XXXX",
  "status": 1000,
  "status_text": "Success",
  "is_final": true,
  "audio": "base64 encoded binary data",
  "addition": {
    "duration": 400,
    "subtitles": [
      { "start_msec": 100, "end_msec": 200, "text": "今" },
      { "start_msec": 200, "end_msec": 400, "text": "天" }
    ],
    "phoneme_timestamps": [
      { "start_msec": 100, "end_msec": 150, "text": "j" },
      { "start_msec": 150, "end_msec": 200, "text": "in1" },
      { "start_msec": 200, "end_msec": 300, "text": "t" },
      { "start_msec": 300, "end_msec": 400, "text": "ian1" }
    ]
  }
}
```

### 2.5 流式参数说明

#### 2.5.1 字段说明

| 参数 | 类型 | 层级 | 必须 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| is_final | Boolean | 1 | | true | 当前请求是否完成上传文本 |

### 2.6 调用示例代码

#### 2.6.1 准备 client 相关依赖

```bash
- python>=3.8
- pip install -i https://pypi.tuna.tsinghua.edu.cn/simple websockets scipy numpy
- MT_DEVELOPER_API_ACCESS_TOKEN="XXXX" 请联系业务人员获取
```

#### 2.6.2 Python Client 代码

```python
import argparse
import asyncio
import base64
import json
import os

import numpy as np
import websockets
from scipy.io import wavfile

MT_DEVELOPER_API_ACCESS_TOKEN = os.environ.get("MT_DEVELOPER_API_ACCESS_TOKEN", "")
if MT_DEVELOPER_API_ACCESS_TOKEN:
    print(f"MT_DEVELOPER_API_ACCESS_TOKEN: {MT_DEVELOPER_API_ACCESS_TOKEN}")


def dump_wav(wav, sample_rate, basename, path="/tmp"):
    if not os.path.exists(path):
        os.makedirs(path)
    filename = os.path.join(path, "{}.wav".format(basename))
    print("dump synthesized audio [{}]s to path {}".format(wav.shape[0] / sample_rate, filename))
    wavfile.write(filename, sample_rate, wav)
    return filename


def get_json_request(text, **kwargs):
    json_message = {
        "cluster": kwargs.get("cluster", None),
        "is_final": kwargs.get("is_final", True),
        "input": {
            "text": text,
            "text_type": kwargs.get("text_type", "plain"),
            "enable_subtitle": kwargs.get("enable_subtitle", False),
            "enable_phoneme_timestamp": kwargs.get("enable_phoneme_timestamp", False),

        },
        "voice_config": {
            "voice_name": kwargs.get("voice_name", None)
        },
        "audio_config": {
            "speed_ratio": kwargs.get("speed_ratio", None)
        }
    }
    print("发送请求message：{}".format(json_message))
    return json_message


async def message_receiving_iterator(websocket):
    while True:
        try:
            message = await websocket.recv()
            data = json.loads(message)
            yield data
            if data.get("audio"):
                data["audio"] = "...音频内容..."
            print("收到响应message：{}".format(data))
            if data.get('is_final', False):
                break
        except websockets.exceptions.ConnectionClosed:
            print("Connection closed")
            break


async def text_sending_handler(websocket, text_stream_list, voice=None, text_type="plain",
                               enable_subtitle=False, enable_phoneme_timestamp=False,
                               speed_ratio=None, mock_request_interval=0, cluster=None):
    for i, text in enumerate(text_stream_list):
        request_json = json.dumps(get_json_request(
            text, voice_name=voice if i == 0 else None,
            text_type=text_type,
            is_final=True if i == len(text_stream_list) - 1 else False,
            enable_subtitle=enable_subtitle,
            enable_phoneme_timestamp=enable_phoneme_timestamp,
            speed_ratio=speed_ratio,
            cluster=cluster,
        ), ensure_ascii=False)
        await websocket.send(request_json)
        if mock_request_interval > 0:
            print("send: {}, wait {}s".format(request_json, mock_request_interval))
            await asyncio.sleep(mock_request_interval)


async def simple_streaming_synthesize(address, text, voice=None, text_type="plain", speed_ratio=1.0,
                                      enable_subtitle=False, enable_phoneme_timestamp=False, cluster=None,
                                      access_token=MT_DEVELOPER_API_ACCESS_TOKEN):
    text_stream_list = text
    mock_request_interval = 1
    if isinstance(text, str):
        text_stream_list = [text]
        mock_request_interval = 0
    async with websockets.connect(address, max_size=1_000_000_000,
                                  extra_headers={"Authorization": f'Bearer {access_token}'}) as websocket:
        response_iter = message_receiving_iterator(websocket)
        sending_task = asyncio.create_task(
            text_sending_handler(websocket, text_stream_list,
                                 voice=voice, text_type=text_type, speed_ratio=speed_ratio,
                                 enable_subtitle=enable_subtitle, enable_phoneme_timestamp=enable_phoneme_timestamp,
                                 cluster=cluster, mock_request_interval=mock_request_interval))
        async for message in response_iter:
            yield message
        await sending_task


def parse_audio_data_from_response(resp: dict):
    audio_b64 = resp["audio"]
    audio_bytes = base64.b64decode(audio_b64)
    audio_data = np.frombuffer(audio_bytes, dtype=np.int16)
    return audio_data


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--address", type=str, 
                        default='wss://aibook-api.mthreads.com:32414/api/v2/tts/stream_generate',
                        help="websocket service address")
    parser.add_argument("--mode", type=str, default="unary",
                        help="streaming mode ('bidi' or 'unary')")
    parser.add_argument("--voice", type=str, default="LYG1004",
                        help="voice name for tts service")
    parser.add_argument("--text", type=str, default="轻轻的，我走了，正如我轻轻的来",
                        help="text to synthesize")
    parser.add_argument("--text_stream", type=str, default="轻轻的|||我走了。|||正如|||我轻轻|||的来",
                        help="mock text stream for bidirectional synthesis, "
                             "text_stream should be a string separated by a |||")
    parser.add_argument("--text_type", type=str, default="plain",
                        help="text type for request text (plain or ssml).")
    parser.add_argument("--cluster", type=str, default="",
                        help="cluster for the voice.")
    parser.add_argument("--speed_ratio", type=float, default=1.0,
                        help="requested speaking speed ratio to synthesize, 1.0 is the default speed.")
    parser.add_argument("--output_fpath", type=str, default="./output.wav",
                        help="fpath to dump wav")
    parser.add_argument("--enable_subtitle", type=lambda s: s.lower() == "true", default="true")
    parser.add_argument("--enable_phoneme_timestamp", type=lambda s: s.lower() == "true", default="true")
    args = parser.parse_args()


    async def synthesize():
        text = args.text
        if args.mode == "bidi":
            assert args.text_stream.strip()
            text = args.text_stream.split("|||")
        print("输入文本: {}".format(text))

        audio_chunks = []
        async for response in simple_streaming_synthesize(
            address=args.address, text=text, text_type=args.text_type,
            voice=args.voice, speed_ratio=args.speed_ratio,
            cluster=args.cluster,
            enable_subtitle=args.enable_subtitle,
            enable_phoneme_timestamp=args.enable_phoneme_timestamp
        ):
            if response["status"] != 1000:
                print("收到错误码：", response["status"])
                print("收到错误信息：", response["status_text"])
                exit(1)
            is_final = response.get("is_final", False)
            audio_chunks.append(parse_audio_data_from_response(response))
            print(f"收到音频，{response['addition']['duration']}毫秒, is_final: [{is_final}]")
        return audio_chunks


    audio_chunks = asyncio.run(synthesize())

    audio_data = np.concatenate(audio_chunks)
    output_base_name = os.path.basename(args.output_fpath).replace(".wav", "")
    output_dir = os.path.dirname(args.output_fpath)
    dump_wav(audio_data, 22050, output_base_name, path=output_dir)
```

#### 2.6.3 使用示例

**单向流式：**
```bash
PYTHONPATH=. MT_DEVELOPER_API_ACCESS_TOKEN="XXXXX" python ws_client.py \
  --voice AIBC006_llm \
  --address wss://aibook-api.mthreads.com:32414/api/v2/tts/stream_generate \
  --enable_subtitle false \
  --enable_phoneme_timestamp false \
  --text "你好，我是穆莎，你的AI朋友，有什么问题就尽管找我吧。"
```

**双向流式（模拟 LLM 逐字输出）：**
```bash
PYTHONPATH=. MT_DEVELOPER_API_ACCESS_TOKEN="XXXXX" python ws_client.py \
  --mode bidi \
  --voice AIBC006_llm \
  --address wss://aibook-api.mthreads.com:32414/api/v2/tts/stream_generate \
  --text_stream "轻轻的|||我走了。|||正如|||我轻轻|||的来"
```

---

## 3. TTS 非流式合成 HTTP 接口

### 3.1 接口地址

**外网访问地址：**
```
https://aibook-api.mthreads.com:32414/api/v1/tts/generate
```

> **注意：** 访问令牌（Access Token）请联系我们获取。联系方式：
> - meng.cai@mthreads.com
> - ye.wang@mthreads.com

### 3.2 TTS 音色列表

**体验 demo：** https://voice.mthreads.com/

音色列表与流式 API 相同，请参考 [2.2 TTS 音色列表](#22-tts-音色列表)

### 3.3 相关参数

| 参数 | 类型 | 是否必需 | 说明 |
|------|------|----------|------|
| text | string | 是 | 待合成文本，必须为 UTF-8 编码，长度不超过 300 字符（英文单词之间需空格）。支持 SSML。 |
| voice | string | 否 | 发音人。请参考上方音色表的 voice_name 字段填写。 |
| format | string | 否 | 输出音频格式，默认为 wav，仅支持 wav 和 mp3。 |
| volume | integer | 否 | 音量。仅限非大模型音色，取值范围 0～100，默认 50。 |
| speech_rate | integer | 否 | 语速。仅限非大模型音色，取值范围 -500～500，默认 0。<br>对应倍速区间 [-500, 0, 500] 分别为 [0.5, 1.0, 2.0]。<br>-500 表示 0.5 倍默认语速，0 表示 1 倍默认语速，500 表示 2 倍默认语速。<br>大约每秒合成 4 字，具体随发音人略有不同。<br>算法说明：小于 1 倍速时用 0.002 系数，大于 1 倍速时用 0.001 系数，结果取近似值。 |

### 3.4 调用示例

#### 3.4.1 Bash / cURL

```bash
curl --location 'https://aibook-api.mthreads.com:32414/api/v1/tts/generate' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: {ACCESS_TOKEN}' \
  --data '{
    "text": "摩尔线程自研语音合成系统",
    "voice": "LYG3001",
    "volume": 50,
    "speech_rate": 0,
    "format": "mp3"
  }' \
  --output "demo.mp3"
```

#### 3.4.2 Python

```python
import requests

api_address = "https://aibook-api.mthreads.com:32414/api/v1/tts/generate"
access_token = "<ACCESS_TOKEN>"

request_payload = {
    "text": "摩尔线程自研语音合成系统",
    "voice": "LYG1004",
    "volume": 50,
    "speech_rate": 0,
    "format": "mp3"
}

resp = requests.post(
    api_address,
    json=request_payload,
    headers={
        'Content-Type': 'application/json',
        'Authorization': access_token
    }
)

if resp.status_code == 200:
    print("Save synthesized audio to demo.mp3")
    with open("demo.mp3", "wb") as f:
        f.write(resp.content)
elif resp.status_code == 400:
    print("Received a client error! [{}]".format(resp.content))
elif resp.status_code == 500:
    print("Received server error! [{}]".format(resp.content))
else:
    print("Received an unknown status code [{}] with content [{}]".format(
        resp.status_code, resp.content))
```

---

## 附录

### 联系方式

如需获取 Access Token 或技术支持，请联系：
- meng.cai@mthreads.com
- ye.wang@mthreads.com

### 版权信息

版权所有 © 2024 摩尔线程，本文档受国际版权法保护。

摩尔线程和摩尔线程徽标是摩尔线程智能科技（北京）有限责任公司的注册商标。

### 免责声明

本文档提供有关摩尔线程产品的信息。本文档并未授权任何知识产权的许可，并未以明示或暗示，或以禁止反言或其他方式授予任何知识产权许可。

---

**文档生成时间：** 2026-02-13

**文档来源：** https://docs.mthreads.com/tts/
