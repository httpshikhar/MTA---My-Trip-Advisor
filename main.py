
import os
from dotenv import load_dotenv
from openai import AzureOpenAI
import json

load_dotenv()

endpoint = os.getenv("ENDPOINT_URL")
deployment = os.getenv("DEPLOYMENT_NAME")

client = AzureOpenAI(
    azure_endpoint=endpoint,
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version='2024-05-01-preview',
)

from agents import search_perplexity, tools

messages = [
    {
        "role": "system", # Changed to system for better practice
        "content": "You are a travel assistant agent, you help people to plan trips according to their age groups. You can use the search_perplexity tool to get live information from the web."
    }
]

while True:
    user_input = input("You: ")
    if user_input.lower() == "exit":
        print("Goodbye!")
        break

    messages.append({"role": "user", "content": user_input})

    # First call to the LLM, potentially asking it to use a tool
    response = client.chat.completions.create(
        model=deployment,
        messages=messages,
        tools=tools,
        tool_choice="auto", # Allow the model to decide whether to call a tool
        max_tokens=13107,
        temperature=0.7,
        top_p=0.95,
        frequency_penalty=0,
        presence_penalty=0,
        stop=None,
    )

    response_message = response.choices[0].message

    # Step 2: Check if the model wanted to call a tool
    if response_message.tool_calls:
        tool_call = response_message.tool_calls[0] # Assuming one tool call for simplicity
        if tool_call.function.name == "search_perplexity":
            function_args = json.loads(tool_call.function.arguments)
            search_query = function_args.get("query")

            print(f"DEBUG: Model requested Perplexity search for: {search_query}")

            # Execute the tool
            tool_output = search_perplexity(search_query)

            print(f"DEBUG: Perplexity search result: {tool_output[:200]}...") # Print first 200 chars

            # Add the tool's output to the messages and call the model again
            messages.append(response_message)
            messages.append(
                {
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": tool_call.function.name,
                    "content": tool_output,
                }
            )

            second_response = client.chat.completions.create(
                model=deployment,
                messages=messages,
                max_tokens=13107,
                temperature=0.7,
                top_p=0.95,
                frequency_penalty=0,
                presence_penalty=0,
                stop=None,
            )
            assistant_response_content = second_response.choices[0].message.content
            print(f"Assistant: {assistant_response_content}")
            messages.append({"role": "assistant", "content": assistant_response_content}) # Add assistant's response to history
    else:
        assistant_response_content = response_message.content
        print(f"Assistant: {assistant_response_content}")
        messages.append({"role": "assistant", "content": assistant_response_content}) # Add assistant's response to history


