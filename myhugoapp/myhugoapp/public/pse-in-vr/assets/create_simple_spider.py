#!/usr/bin/env python3
"""
Create a simple spider GLB model for testing
This creates a basic spider shape without requiring Blender
"""

from io import BytesIO
import struct
import json
import base64

# Create a simple GLTF/GLB file structure
# This is a minimal valid GLB file with a simple spider shape

def create_simple_spider_glb():
    # Simple spider body and legs using basic geometry
    # This creates a very basic spider-like shape

    gltf = {
        "asset": {
            "version": "2.0",
            "generator": "Simple Spider Creator"
        },
        "scene": 0,
        "scenes": [
            {
                "nodes": [0]
            }
        ],
        "nodes": [
            {
                "name": "Spider",
                "children": [1, 2],
                "translation": [0, 0.5, 0]
            },
            {
                "name": "Body",
                "mesh": 0
            },
            {
                "name": "Legs",
                "mesh": 1
            }
        ],
        "meshes": [
            {
                "name": "SpiderBody",
                "primitives": [
                    {
                        "attributes": {"POSITION": 0},
                        "indices": 1,
                        "mode": 4
                    }
                ]
            },
            {
                "name": "SpiderLegs",
                "primitives": [
                    {
                        "attributes": {"POSITION": 2},
                        "indices": 3,
                        "mode": 1
                    }
                ]
            }
        ],
        "buffers": [
            {
                "uri": "data:application/octet-stream;base64,",
                "byteLength": 0
            }
        ],
        "bufferViews": [],
        "accessors": []
    }

    # For now, return the JSON structure
    # In a real implementation, we'd add the actual binary geometry data
    return json.dumps(gltf, indent=2)

# Create the file
output = create_simple_spider_glb()
print(output)
