#!/usr/bin/env python3
"""
Convert spider.blend to spider.glb using Blender's Python API
Usage: blender -b spider.blend -P convert_blend.py
"""

import bpy
import os
import sys

try:
    # Get the input file path
    input_path = sys.argv[-1] if len(sys.argv) > 1 else 'spider.blend'

    # Clear existing scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # Import the blend file
    bpy.ops.wm.open_mainfile(filepath=input_path)

    # Export to GLB
    output_path = os.path.splitext(input_path)[0] + '.glb'
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_selected=False,
        export_tangents=True,
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_colors=True
    )

    print(f"Successfully converted to {output_path}")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
