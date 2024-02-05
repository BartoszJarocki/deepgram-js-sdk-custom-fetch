import { DeepgramClientOptions, createClient } from "@deepgram/sdk";

import fetch from "cross-fetch";

interface ResponseTimeoutFetchOptions extends RequestInit {
  connectionTimeout?: number;
}

async function fetchWithConnectionTimeout(
  input: RequestInfo | URL,
  init?: ResponseTimeoutFetchOptions
): Promise<Response> {
  const controller = new AbortController();
  const signal = controller.signal;
  const { connectionTimeout, ...fetchOptions } = init || {};

  // Set a timeout to abort the fetch request
  if (connectionTimeout) {
    setTimeout(() => {
      controller.abort();
    }, connectionTimeout);
  }

  // Use cross-fetch with the AbortController signal
  try {
    const response = await fetch(input.toString(), { ...fetchOptions, signal });
    return response;
  } catch (error) {
    if ((error as DOMException).name === "AbortError") {
      // Handle fetch abort due to timeout
      throw new Error("Fetch aborted due to connection timeout");
    } else {
      // Re-throw other errors
      throw error;
    }
  }
}

interface ResponseTimeoutFetchOptions extends RequestInit {
  responseTimeout?: number; // Custom response timeout in milliseconds
}

async function fetchWithResponseTimeout(
  input: RequestInfo | URL,
  init?: ResponseTimeoutFetchOptions
): Promise<Response> {
  const controller = new AbortController();
  const { responseTimeout, ...fetchOptions } = init || {};
  fetchOptions.signal = controller.signal;

  // Initialize timeoutId with undefined and specify its type explicitly
  let timeoutId: NodeJS.Timeout | undefined;

  if (responseTimeout) {
    timeoutId = setTimeout(() => {
      controller.abort();
    }, responseTimeout);
  }

  try {
    const response = await fetch(input.toString(), fetchOptions);
    // Clear the timeout if it has been set
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    return response;
  } catch (error) {
    if ((error as DOMException).name === "AbortError") {
      throw new Error("Fetch aborted due to response timeout");
    } else {
      throw error;
    }
  } finally {
    // Ensure that clearTimeout is called to handle cases where the fetch might be aborted externally
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

const opts: DeepgramClientOptions = {
  //fetch: fetchWithConnectionTimeout,
  fetch: fetchWithResponseTimeout,
};

const deepgram = createClient("", opts);
