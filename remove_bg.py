from PIL import Image
import sys

def remove_bg(input_path, output_path, threshold=220):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # Calculate brightness
        brightness = (item[0] + item[1] + item[2]) / 3
        
        if brightness > threshold:
            # Map brightness from [threshold, 255] to alpha [255, 0]
            # If brightness is 255, alpha is 0. If brightness is threshold, alpha is 255.
            alpha = int(255 * (255 - brightness) / (255 - threshold))
            newData.append((item[0], item[1], item[2], alpha))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")

if __name__ == '__main__':
    remove_bg(sys.argv[1], sys.argv[2])
