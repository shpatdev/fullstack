import os
import sys

# --- Configuration ---
# Directories to include in the scan (relative to the script's location)
# Add or remove directories as needed.
# For example, if you have other apps, add them here: e.g., ['api', 'food_delivery_project', 'users_app']
SOURCE_DIRECTORIES = ['api', 'food_delivery_project']

OUTPUT_FILENAME = 'all_django_code.txt'  # Name of the output file

# File extensions to include (add more if needed, e.g., '.html', '.css', '.js')
INCLUDE_EXTENSIONS = ['.py', '.html', '.css', '.js', '.txt', '.md', '.json', '.yaml', '.yml']

# Directories to completely exclude by name
EXCLUDE_DIRS_ABSOLUTE = ['venv', '.git', '.idea', 'migrations', '__pycache__', 'media', 'static']
# If you have a 'static' or 'media' folder inside an app that you *do* want to include,
# be more specific or handle it by not adding 'static'/'media' here broadly.

# Files to exclude by name
EXCLUDE_FILES = ['manage.py', OUTPUT_FILENAME]
# --- End Configuration ---

def get_files_recursively(base_dir, current_dir_path):
    """
    Recursively gets all files from the specified directory,
    respecting exclusions.
    """
    files_to_include = []
    try:
        for entry in os.listdir(current_dir_path):
            full_path = os.path.join(current_dir_path, entry)
            relative_entry_path_from_base = os.path.relpath(full_path, base_dir)

            if os.path.isdir(full_path):
                if entry not in EXCLUDE_DIRS_ABSOLUTE and not entry.startswith('.'):
                    files_to_include.extend(get_files_recursively(base_dir, full_path))
            else:
                # Check if the file itself or its direct parent (for top-level files in SOURCE_DIRECTORIES)
                # is not in excluded names and if the extension is desired.
                if (entry not in EXCLUDE_FILES and
                        not entry.startswith('.') and
                        any(entry.endswith(ext) for ext in INCLUDE_EXTENSIONS)):
                    files_to_include.append(full_path)
    except FileNotFoundError:
        print(f"Warning: Directory not found: {current_dir_path}")
    except Exception as e:
        print(f"Error accessing {current_dir_path}: {e}")
    return files_to_include

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file_path = os.path.join(script_dir, OUTPUT_FILENAME)

    # Remove old output file if it exists
    if os.path.exists(output_file_path):
        os.remove(output_file_path)

    all_project_files = []
    for src_dir_name in SOURCE_DIRECTORIES:
        abs_src_dir = os.path.join(script_dir, src_dir_name)
        if os.path.isdir(abs_src_dir):
            print(f"Scanning directory: {abs_src_dir}...")
            # For get_files_recursively, base_dir is the specific source directory
            # to make relative paths in the output more sensible.
            all_project_files.extend(get_files_recursively(abs_src_dir, abs_src_dir))
        else:
            print(f"Warning: Source directory '{src_dir_name}' not found at '{abs_src_dir}'. Skipping.")

    # Deduplicate in case of overlapping paths (though less likely with distinct SOURCE_DIRECTORIES)
    all_project_files = sorted(list(set(all_project_files)))

    if not all_project_files:
        print("No files found to process based on the configuration.")
        return

    with open(output_file_path, 'w', encoding='utf-8') as outfile:
        for file_path in all_project_files:
            relative_path = os.path.relpath(file_path, script_dir)
            outfile.write(f"# File: {relative_path}\n\n")
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                    outfile.write(infile.read())
                outfile.write(f"\n\n# End of File: {relative_path}\n")
                outfile.write("#" + "-" * 78 + "\n\n")
            except Exception as e:
                outfile.write(f"# Error reading file {relative_path}: {e}\n\n")
                outfile.write(f"\n\n# End of File (with error): {relative_path}\n")
                outfile.write("#" + "-" * 78 + "\n\n")

    print(f"✅ Successfully combined content from {len(all_project_files)} files into {output_file_path}")

if __name__ == '__main__':
    main()