#!/usr/bin/env python3
"""
Screenshot Resizer for App Store Connect
Resizes screenshots to App Store required dimensions
"""

from PIL import Image
import sys
import os

def resize_screenshot(input_path, output_path=None):
    """
    Resize screenshot to App Store Connect dimensions

    Required sizes:
    - 1242 × 2688px (iPhone 14 Pro Max, 13 Pro Max, 12 Pro Max)
    - 1284 × 2778px (iPhone 15 Pro Max, 14 Pro Max)
    """

    # Target dimensions (portrait)
    TARGET_WIDTH = 1284
    TARGET_HEIGHT = 2778

    try:
        # Open image
        img = Image.open(input_path)
        current_width, current_height = img.size

        print(f"📱 Original size: {current_width} × {current_height}px")

        # Calculate aspect ratio
        target_aspect = TARGET_WIDTH / TARGET_HEIGHT
        current_aspect = current_width / current_height

        print(f"📐 Target size: {TARGET_WIDTH} × {TARGET_HEIGHT}px")
        print(f"📏 Aspect ratios - Current: {current_aspect:.3f}, Target: {target_aspect:.3f}")

        # Method 1: Resize to fit (maintains aspect ratio, adds padding if needed)
        if current_aspect > target_aspect:
            # Image is wider - fit to width
            new_width = TARGET_WIDTH
            new_height = int(TARGET_WIDTH / current_aspect)
        else:
            # Image is taller - fit to height
            new_height = TARGET_HEIGHT
            new_width = int(TARGET_HEIGHT * current_aspect)

        # Resize image
        resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Create canvas with target dimensions
        canvas = Image.new('RGB', (TARGET_WIDTH, TARGET_HEIGHT), color='white')

        # Center the resized image on canvas
        x_offset = (TARGET_WIDTH - new_width) // 2
        y_offset = (TARGET_HEIGHT - new_height) // 2
        canvas.paste(resized, (x_offset, y_offset))

        # Output path
        if output_path is None:
            base, ext = os.path.splitext(input_path)
            output_path = f"{base}_appstore{ext}"

        # Save
        canvas.save(output_path, quality=95)

        print(f"✅ Saved resized screenshot to: {output_path}")
        print(f"📦 Final size: {TARGET_WIDTH} × {TARGET_HEIGHT}px")

        return output_path

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 resize-screenshot.py <input_image>")
        print("Example: python3 resize-screenshot.py landing-screen.png")
        sys.exit(1)

    input_image = sys.argv[1]

    if not os.path.exists(input_image):
        print(f"❌ File not found: {input_image}")
        sys.exit(1)

    resize_screenshot(input_image)
