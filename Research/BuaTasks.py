# Serve /BuaTask route

from browser_use import Agent
from browser_use.browser.browser import Browser, BrowserConfig
from browser_use.browser.context import BrowserContext, BrowserContextConfig
from langchain_google_genai import ChatGoogleGenerativeAI as ChatOpenAI
import asyncio, os, urllib.parse, json

from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
os.environ["OPENAI_API_KEY"] = 'AIzaSyDs2z22gwy2ZkPYeuPeNa-yKDdvUb-0NpA'
os.environ["GOOGLE_API_KEY"] = 'AIzaSyDs2z22gwy2ZkPYeuPeNa-yKDdvUb-0NpA'

llm = ChatOpenAI(model="gemini-2.0-flash")

def check_event_loop():
    try:
        loop = asyncio.get_event_loop()
        #if not loop.is_running():
        if loop.is_closed():
            print("*******************Event loop is closed. Creating and setting a new event loop.")
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
    except Exception as e:
        print(f"*************************Error: {e}. Creating and setting a new event loop.")
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        print("************************New event loop created and set.")

# Configure the browser
browser = Browser(
    config=BrowserConfig(
        headless=True  # Use headless (invisible) mode for server environments. Default is False.
    )
)
    
# Configure the browser context
contextConfig = BrowserContextConfig(
    # same or close user_agent for Chrome and Chromium.
    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
    wait_for_network_idle_page_load_time=5.0,   # default is 3.0 seconds
    cookies_file="./cookies.json",
    #trace_path = "./trace",
    locale='en-US',
    disable_security=True  # Disable browser security features. Default is False.
)


async def FinUrl(data):
    print('+++++++++++++++++++++++++ FinUrl(): ', data)

    company = data.get('company', 'TSLA')
    task = f'Please find the stock symbol and the URL of the Google Finance page of {company}. Provide the Symbol and the URL in a JSON format as the result. '

    try:
        await browser.close()
    except Exception as e:
        print('++++++++++++++  browser.close() error: ', e)

    # Define the agent
    agent = Agent(
        #browser=browser,
        browser_context=BrowserContext(browser=browser, config=contextConfig),
        task=task,
        llm=llm,
    )

    try:
        check_event_loop()
        result = await agent.run(max_steps=10)
        check_event_loop()
    except Exception as e:
        print('+++++++++++++++++++++++++ FinUrl() error: ', e)
        result = None
    # finally:
        #await agent.browser_context.close()
        #await browser.close()
   
    # Process results token-wise
    payload = None
    for action in result.action_results():
        print(action.extracted_content,end="\r",flush=True)
        print("\n\n")
        if action.is_done:
            payload = action.extracted_content
            break

    if payload is None:
        symbol = "NA"
        url = "NA"
    else:
        index = payload.find('is ')
        if index != -1:
            symbol = payload[index+3:]
            index = symbol.find(' ')
            if index != -1:
                symbol = symbol[:index]
            if not symbol[-1].isalpha(): # drop last char if it is not a letter
                symbol = symbol[:-1]
        else:
            symbol = "NA"

        index = payload.find('http')
        if index != -1:
            url = payload[index:]
        else:
            url = "NA"
    
    if symbol != 'NA' and url == 'NA':
        url = 'https://www.google.com/finance/quote/' + urllib.parse.quote(symbol)
    print('------------------payload: ', symbol, url)
    return symbol, url


# from LSTMfin import LSTMfin
# async def NextPrice(data):
#     print('+++++++++++++++++++++++++ NextPrice(): ', data)
#     symbol = data.get('symbol', 'TSLA')

#     try:
#         symbol, price, data = LSTMfin(symbol)
#     except Exception as e:
#         print('++++++++++++++  LSTMfin() error: ', e)
#     finally:
#         print('+++++++++++++++++++++++++ LSTMfin() done')

#     print('------------------payload: ', symbol, price, data)
#     return symbol, price, data


async def AskBua(data):
    print('------------------ AskBua() req: ', data)

    symbol = data.get('symbol', 'TSLA')
    GoogleFinance = 'https://www.google.com/finance/quote/' + urllib.parse.quote(symbol)
    url = data.get('url', GoogleFinance)
    task = data.get('task', 'Perform a default task')

    if task == '':
        task = 'Perform a default task'
    if url == '':
        url = GoogleFinance
    
    task = f'Please perform the following task for the company {symbol}: {task}'
    print('------------------ AskBua(): ', symbol, url, task)

    try:
        print('+++ AskBua() 1')
        await browser.close()
        print('+++ AskBua() 2')
    except Exception as e:
        print('++++++++++++++  browser.close() error: ', e)
    
    # Define the agent
    agent = Agent(
        #initial_actions=[{'open_tab': {'url': url}}],
        browser_context=BrowserContext(browser=browser, config=contextConfig),
        task=task,
        llm=llm,
    )

    try:
        result = await agent.run(max_steps=10)
    except Exception as e:
        print('+++++++++++++++++++++++++ AskBua() error: ', e)
        result = None
    finally:
        print('+++++++++++++++++++++++++ AskBua() 6')
        #await agent.browser_context.close()
        #await browser.close()

    payload = None
    for action in result.action_results():
        print(action.extracted_content,end="\r", flush=True)
        print("\n\n")
        if action.is_done:
            payload = action.extracted_content
            break
    if payload is None:
        payload = "NA"
    print('------------------ AskBua() res: ', payload)
    return payload


async def AskOpenAi(data):
    print('------------------ AskOpenAi() req: ', data)
    symbol = data.get('symbol', 'TSLA')
    prompt = data.get('task', f'What is the last close stock price of {symbol}?')
    prompt = f'{symbol} is the company name or its stock symbol. ' + prompt

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI()  # Uses OPENAI_API_KEY from environment variables by default.

        completion = await client.chat.completions.create(
            model="gpt-4o", # model="gpt-4o-mini",
            messages=[
                {"role": "assistant", "content": "Talk like a financial advisor."},
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        )
        reply = completion.choices[0].message.content
        print('------------------ AskOpenAi() res: ', reply)
        return reply
    except Exception as e:
        print('+++++++++++++++++++++++++ AskOpenAi() error:', e)
        return json.dumps({"error": str(e)}), 500

