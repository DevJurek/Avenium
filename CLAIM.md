# User-paid claim airdrop

To jest wariant, w którym użytkownik płaci gas przy `claim()`.

## Jak to działa
1. Generujesz listę adresów i kwot w `claim-recipients.csv`.
2. Uruchamiasz generator Merkle tree.
3. Deployujesz `AveniumClaim` z rootem.
4. Zasilasz kontrakt tokenami AVEN.
5. Każdy użytkownik wywołuje `claim(amount, proof)` z własnego portfela.

## Komendy
```bash
npm run claim:generate -- claim-recipients.example.csv
npm run claim:deploy:polygon
npm run claim:fund:polygon
```

## Uwaga
- Użytkownik nadal musi mieć gas w sieci, w której robi claim.
- Kontrakt nie mintuje nowych tokenów, tylko rozdaje już zdeponowane AVEN.
