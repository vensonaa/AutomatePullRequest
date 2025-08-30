#!/usr/bin/env python3
"""
Setup script for GitHub PR Automation
"""

from setuptools import setup, find_packages
import os

# Read the README file
def read_readme():
    with open("README.md", "r", encoding="utf-8") as fh:
        return fh.read()

# Read requirements
def read_requirements():
    with open("requirements.txt", "r", encoding="utf-8") as fh:
        return [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="github-pr-automation",
    version="1.0.0",
    author="GitHub PR Automation Team",
    author_email="team@example.com",
    description="AI-powered GitHub PR automation with Groq and Google Sheets tracking",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/github-pr-automation",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Software Development :: Quality Assurance",
    ],
    python_requires=">=3.8",
    install_requires=read_requirements(),
    entry_points={
        "console_scripts": [
            "github-pr-automation=main:app",
        ],
    },
    include_package_data=True,
    zip_safe=False,
    keywords="github, pull-request, automation, ai, groq, google-sheets",
    project_urls={
        "Bug Reports": "https://github.com/yourusername/github-pr-automation/issues",
        "Source": "https://github.com/yourusername/github-pr-automation",
        "Documentation": "https://github.com/yourusername/github-pr-automation#readme",
    },
)
