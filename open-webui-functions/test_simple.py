"""
title: Simple Test
author: test
version: 1.0.0
description: Minimal test function
"""

class Tools:
    def __init__(self):
        pass

    def test_function(self, input_text: str) -> str:
        """
        A simple test function.
        :param input_text: Some text to echo back
        :return: The input text echoed back
        """
        return f"You said: {input_text}"
