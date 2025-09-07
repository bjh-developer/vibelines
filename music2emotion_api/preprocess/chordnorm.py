import os
import shutil
import json
import math
import chordparser

PITCH_CLASS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

pitch_num_dic = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
}

minor_major_dic = {
    'D-':'C#', 'E-':'D#', 'G-':'F#', 'A-':'G#', 'B-':'A#'
}
minor_major_dic2 = {
    'Db':'C#', 'Eb':'D#', 'Gb':'F#', 'Ab':'G#', 'Bb':'A#'
}


shift_major_dic = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
}

shift_minor_dic = {
    'A': 0, 'A#': 1, 'B': 2, 'C': 3, 'C#': 4, 'D': 5,  
    'D#': 6, 'E': 7, 'F': 8, 'F#': 9, 'G': 10, 'G#': 11, 
}

flat_to_sharp_mapping = {
    "Cb": "B", 
    "Db": "C#", 
    "Eb": "D#", 
    "Fb": "E", 
    "Gb": "F#", 
    "Ab": "G#", 
    "Bb": "A#"
}

# Function to parse a .lab file and convert it to Roman numerals
def convert_chords_to_roman(file_path, key, key_type='major'):
    print(file_path)
    with open(file_path, 'r') as f:
        lines = f.readlines()

    if key == "None":
        new_key = "C major"
        shift = 0
    else:
        #print ("asdas",key)
        if len(key) == 1:
            key = key[0].upper()
        else:
            key = key[0].upper() + key[1:]

        if key in minor_major_dic2:
            key = minor_major_dic2[key]
        
        shift = 0
        
        if key_type == "major":
            new_key = "C major"
            
            shift = shift_major_dic[key]
        else:
            new_key = "A minor"
            shift = shift_minor_dic[key]
    
    converted_lines = []
    for line in lines:
        if line.strip():  # Skip empty lines
            parts = line.split()
            start_time = parts[0]
            end_time = parts[1]
            chord = parts[2]  # The chord is in the 3rd column
            if chord == "N":
                newchordnorm = "N"
            elif chord == "X":
                newchordnorm = "X"
            elif ":" in chord:
                pitch = chord.split(":")[0]
                attr = chord.split(":")[1]
                pnum = pitch_num_dic [pitch]
                new_idx = (pnum - shift)%12
                newchord = PITCH_CLASS[new_idx]
                newchordnorm = newchord + ":" + attr
            else:
                pitch = chord
                pnum = pitch_num_dic [pitch]
                new_idx = (pnum - shift)%12
                newchord = PITCH_CLASS[new_idx]
                newchordnorm = newchord
            
            # roman_chord = chord_to_roman(chord, key, key_type)
            
            converted_lines.append(f"{start_time} {end_time} {newchordnorm}\n")
    
    return converted_lines

def sanitize_key_signature(key):
    return key.replace('-', 'b')
# Main function to process all files and save the output
def process_dataset(chord_dir, key_dir, output_dir):
    # aa = False
    for root, _, files in os.walk(chord_dir):
        for file in files:

            if file.endswith('.lab'):
                chord_file_path = os.path.join(root, file)
                
                # Construct corresponding key file path
                rel_path = os.path.relpath(chord_file_path, chord_dir)
                key_file_path = os.path.join(key_dir, rel_path)
                
                if os.path.exists(key_file_path):
                    
                    with open(key_file_path, 'r') as f:
                        key_line = f.readline().strip()
                        key_parts = key_line.split()
                        key_signature = sanitize_key_signature(key_parts[0])  # Sanitize key signature
                        key_type = key_parts[1] if len(key_parts) > 1 else 'major'

                    converted_lines = convert_chords_to_roman(chord_file_path, key_signature, key_type)
                    # Determine output file path
                    output_file_path = os.path.join(output_dir, rel_path)
                    os.makedirs(os.path.dirname(output_file_path), exist_ok=True)
                    
                    # Write the converted lines to the new file
                    with open(output_file_path, 'w') as f:
                        f.writelines(converted_lines)
                    print(f"Processed: {chord_file_path} -> {output_file_path}")
                else:
                    print(f"Key file not found for: {chord_file_path}")

# Example usage
if __name__ == '__main__':
    chord_directory = '../dataset/emomusic/chord/lab'
    key_directory = '../dataset/emomusic/key'
    output_directory = '../dataset/emomusic/chord/lab3'
    
    process_dataset(chord_directory, key_directory, output_directory)
