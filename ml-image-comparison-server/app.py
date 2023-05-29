from flask import Flask, jsonify, request
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.resnet50 import preprocess_input
import numpy as np
import base64
import io

app = Flask(__name__)

model = tf.keras.applications.ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

def preprocess(img_data):
    img = image.load_img(io.BytesIO(base64.b64decode(img_data)), target_size=(224, 224))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    return x

def preprocessFromImage(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    return x

def image_similarity(image1_data, image2_data):
    img1 = preprocess(image1_data)
    img2 = preprocess(image2_data)

    features1 = model.predict(img1)
    features2 = model.predict(img2)

    features1 = features1.flatten()
    features2 = features2.flatten()
    similarity_score = np.dot(features1, features2) / (np.linalg.norm(features1) * np.linalg.norm(features2))
    return similarity_score

def image_similarityV2(schemaPath, image2_data):
    img1 = preprocessFromImage(schemaPath)
    img2 = preprocess(image2_data)

    features1 = model.predict(img1)
    features2 = model.predict(img2)

    features1 = features1.flatten()
    features2 = features2.flatten()
    similarity_score = np.dot(features1, features2) / (np.linalg.norm(features1) * np.linalg.norm(features2))
    return similarity_score

@app.route('/similarity', methods=['POST'])
def compute_similarity():
    try:
        print("Request Recieved")
        data = request.get_json()
        image1_data = data['image1']
        image2_data = data['image2']

        similarity_score = image_similarity(image1_data, image2_data)
        result = round(similarity_score * 100)

        return jsonify({'similarity_score': result})

    except Exception as e:
        print('POST /similarity error: %e' % e)
        return jsonify({'error': str(e)})
    
@app.route('/similarityV2', methods=['POST'])
def compute_similarityV2():
    try:
        print("Request Recieved")
        data = request.get_json()
        SchemaID = data['schemaID']
        image2_data = data['image2']

        schemaPath = f"{SchemaID}.png"

        similarity_score = image_similarityV2(schemaPath, image2_data)
        result = round(similarity_score * 100)

        return jsonify({'similarity_score': result})

    except Exception as e:
        print('POST /similarity error: %e' % e)
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    from waitress import serve
    print('Server is up...')
    # set production = True when deploying to production
    serve(app, host='0.0.0.0', port=5000, threads=50)