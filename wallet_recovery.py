from bip_utils import Bip39MnemonicGenerator, Bip39SeedGenerator, Bip44, Bip44Coins
from itertools import product

# Load BIP39 wordlist (you'll need to download it or include it locally)
with open("wordlist.txt") as f:
    words = f.read().splitlines()

# Known parts of your mnemonic (with missing parts as empty strings)
mnemonic_template = ["orient", "donor", "", "", "kiwi", "moon", "wagon", "", "thrive", "meat", "pepper", "wink"]

# Indices of the missing words
missing_positions = [2, 3, 7]  # indices of the missing words

# Iterate through all possible combinations of the missing words
for combination in product(words, repeat=3):
    # Create a copy of the mnemonic template
    mnemonic = mnemonic_template.copy()
    
    # Fill in the missing words with the current combination
    for i, word in zip(missing_positions, combination):
        mnemonic[i] = word
    
    # Join the mnemonic words into a single string
    mnemonic_phrase = " ".join(mnemonic)
    
    # Generate the seed and derive the wallet address
    seed = Bip39SeedGenerator(mnemonic_phrase).Generate()
    wallet = Bip44.FromSeed(seed, Bip44Coins.ETHEREUM).PublicKey().ToAddress()
    
    # Check if the generated address matches your wallet address
    if wallet == "0x8a9b2267807F0bB960438f2564D8E68FF31E75eF":
        print(f"Match found! Mnemonic: {mnemonic_phrase}")
        break
