from music21 import converter
import os
from tqdm import tqdm

def extract_key_signatures(directory):
    # Find all MIDI files in the directory
    midi_files = [os.path.join(root, file) for root, dirs, files in os.walk(directory) for file in files if file.endswith('.midi') or file.endswith('.mid')]
    
    # Create corresponding directories for .lab files
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.midi') or file.endswith('.mid'):
                root_lab = root.replace("midi", "key")
                if not os.path.exists(root_lab):
                    os.makedirs(root_lab)

    # Process each MIDI file with a progress bar
    for file_path in tqdm(midi_files, desc='Processing MIDI files', unit='file'):
        file_name = os.path.basename(file_path)
        key_path = file_path[0:-4] + "lab"
        key_path = key_path.replace("midi", "key")
        
        try:
            midi_file = converter.parse(file_path)
            key_signature = str(midi_file.analyze('key'))
        except Exception as e:
            key_signature = "None"

        # Save the key signature to a .lab file
        with open(key_path, 'w') as f:
            f.write(str(key_signature))
    
if __name__ == '__main__':
    directory = '../dataset/pmemo/midi'
    
    extract_key_signatures(directory)
