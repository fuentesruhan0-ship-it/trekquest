from PIL import Image
import os

# Paths
logo_path = r'C:\Users\flean\Downloads\6c3d1cde-322d-488b-86f6-35fa2ad12dca.jpg'
public_dir = r'c:\Users\flean\Downloads\trek-quest (2)\trek-quest\public'

# Icon sizes to generate
icons = [
    ('icon-192.png', 192),
    ('icon-512.png', 512),
    ('apple-touch-icon.png', 180),
]

# Maskable icons (with padding for safe area)
maskable_icons = [
    ('icon-192-maskable.png', 192),
    ('icon-512-maskable.png', 512),
]

def generate_icon(input_path, output_path, size):
    """Generate a square icon from the logo"""
    img = Image.open(input_path)
    
    # Convert to RGB if necessary
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Resize maintaining aspect ratio
    img.thumbnail((size, size), Image.Resampling.LANCZOS)
    
    # Create a white background
    background = Image.new('RGB', (size, size), (255, 255, 255))
    
    # Calculate position to center the image
    offset = ((size - img.width) // 2, (size - img.height) // 2)
    background.paste(img, offset)
    
    # Save
    background.save(output_path, 'PNG')
    print(f'✓ Generated {os.path.basename(output_path)}')

def generate_maskable_icon(input_path, output_path, size):
    """Generate a maskable icon with 10% padding"""
    padding_percent = 0.1
    content_size = int(size * (1 - 2 * padding_percent))
    
    img = Image.open(input_path)
    
    # Convert to RGB if necessary
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Resize maintaining aspect ratio
    img.thumbnail((content_size, content_size), Image.Resampling.LANCZOS)
    
    # Create a white background
    background = Image.new('RGB', (size, size), (255, 255, 255))
    
    # Calculate position to center the image
    offset = ((size - img.width) // 2, (size - img.height) // 2)
    background.paste(img, offset)
    
    # Save
    background.save(output_path, 'PNG')
    print(f'✓ Generated {os.path.basename(output_path)} (maskable)')

print('Generating icons from logo...\n')

try:
    # Generate regular icons
    for filename, size in icons:
        output_path = os.path.join(public_dir, filename)
        generate_icon(logo_path, output_path, size)
    
    # Generate maskable icons
    for filename, size in maskable_icons:
        output_path = os.path.join(public_dir, filename)
        generate_maskable_icon(logo_path, output_path, size)
    
    print('\n✅ All icons generated successfully!')
    
except Exception as e:
    print(f'❌ Error: {e}')
    exit(1)
