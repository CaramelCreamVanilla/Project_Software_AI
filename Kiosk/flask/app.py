from flask import Flask, request, jsonify , send_from_directory
from flask_cors import CORS
import os
import torch
from transformers import pipeline 
import scipy.io.wavfile
#-----------------------Model------------------------------

MODEL_NAME = "biodatlab/whisper-th-small-combined"
lang = "th"

cuda_available = torch.cuda.is_available()
device = torch.device("cuda" if cuda_available else "cpu")

pipe_spech_to_text = pipeline(
    task="automatic-speech-recognition",
    model=MODEL_NAME,
    chunk_length_s=30,
    device=device if cuda_available else -1,  
)

text_to_speech_pipeline = pipeline("text-to-speech", model="facebook/mms-tts-tha")

def SpeechReconization(filename):
    text = pipe_spech_to_text(filename, generate_kwargs={"language":"<|th|>", "task":"transcribe"}, batch_size=16)["text"]
    return text

def SpeechSynthesis(q_id , text):
    output = text_to_speech_pipeline(text)

    audio_data = output['audio']
    sampling_rate = output['sampling_rate']

    if audio_data.ndim == 2 and audio_data.shape[0] == 1:
        audio_data = audio_data[0]
    
    if not os.path.exists("question_voice"):
        os.makedirs("question_voice")

    file_name = f"q_{q_id}_speech.wav"
    file_path = os.path.join("question_voice", file_name)

    scipy.io.wavfile.write(file_path, sampling_rate, audio_data)
    
    return file_name
#--------------------------------Model------------------------------

app = Flask(__name__)
# app.config['SECRET_KEY'] = 'ICE_MENTOS'
CORS(app)
# CORS(app, resources={r"*": {"origins": "http://152.42.189.176:5556"}})

@app.route('/testAPI' , methods=['GET'])
def testAPI():
    return jsonify({'result' : 'your API is Work'})  

#-----------------------Speech_Rocognization--------------------------------------------
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files: #เช็คว่ามี key ชื่อ file มั้ย
        return jsonify({'error': 'No file part'}), 400
    # print(request)
    file = request.files['file']
    # print("file here")
    # print(file)
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        # ที่นี่คุณสามารถเซฟไฟล์ไปยัง server หรือทำการประมวลผลไฟล์เลย
        filename = os.path.join('uploads', file.filename) #ได้ filename = uploads/audio.wav
        file.save(filename)
        output = SpeechReconization(filename)
        

        return jsonify({'message': 'File uploaded successfully',
                         'filename': file.filename,
                         'output': output})
#-----------------------Speech_Rocognization--------------------------------------------
    
#-----------------------Speech_Synthesis--------------------------------------------
@app.route('/synthesis', methods=['POST'])
def synthesis():
    q_id = request.json.get('q_row')
    question = request.json.get('question')

    # print(q_id)
    
    file_name = SpeechSynthesis(q_id,question)
    # print(file_name)

    if file_name:
        return jsonify({'message': 'Successfully updated filename'})
    else:
        return jsonify({'error': 'failed to synthesis'}), 404
#-----------------------Speech_Synthesis--------------------------------------------
    
#-----------------------get_Qvoice--------------------------------------------
AUDIO_FOLDER = os.path.join(os.getcwd(), 'question_voice')

@app.route('/question_voice/<filename>')  #สร้าง Route เพื่อให้สามารถส่งกลับไฟล์เสียงไปเล่นบน React ได้
def serve_audio_file(filename):
    return send_from_directory(AUDIO_FOLDER, filename)


@app.route('/get_qvoice',methods=['POST'])
def get_qvoice():
    fname = request.json.get('filename')
    # print(fname)
    audio_path = f'http://localhost:5558/question_voice/{fname}' #URL เพื่อให้เข้าถึงไฟล์เสียงได้
    return jsonify({'audioPath': audio_path})    
#-----------------------get_Qvoice--------------------------------------------

#-----------------------------Delete voice--------------------------------------
@app.route('/deleteFile', methods=['POST'])
def delete_voice():
    filename = request.json.get('filename')
    print(filename)
    file_path = os.path.join("question_voice", filename)

    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({"message": "File deleted successfully."}), 200
    else:
        # If the file does not exist, return an error message
        return jsonify({"error": "File not found."}), 404

#-----------------------------Delete voice--------------------------------------



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5558)
