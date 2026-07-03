# Skybit (SKY) — specyfikacja i wdrożenie

## 1) Kod smart kontraktu

Plik: `/home/jurek/Documents/Crypto/Skybit.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Skybit (SKY)
/// @notice Fixed-supply ERC-20 token: 21,000,000 SKY minted once to the deployer.
contract Skybit is ERC20 {
    // Całkowita podaż: 21 mln tokenów z 18 miejscami po przecinku (standard ERC-20).
    uint256 public constant MAX_SUPPLY = 21_000_000 * 10 ** 18;

    constructor() ERC20("Skybit", "SKY") {
        // Mint całej puli do adresu wdrażającego kontrakt (msg.sender).
        // Po deployment nie ma dodatkowych funkcji mint/burn, więc podaż jest stała.
        _mint(msg.sender, MAX_SUPPLY);
    }
}
```

Uwagi techniczne:
- To jest kontrakt o stałej podaży; nie ma kopania (miningu).
- `msg.sender` dostaje całość podczas wdrożenia.
- Standardowe 18 miejsc po przecinku oznacza, że 21 000 000 SKY to `21_000_000 * 10^18` jednostek bazowych.
- Biblioteka OpenZeppelin musi być dostępna w projekcie (np. Remix / Hardhat / Foundry).

---

## 2) Instrukcja wdrożenia puli płynności na DEX

Najprostszy wariant: użyj DEX w stylu V2, np. PancakeSwap V2, QuickSwap V2 lub innego AMM z klasyczną pulą x*y=k. To jest prostsze niż V3.

### Krok 1 — przygotuj portfel
1. Dodaj sieć do MetaMask:
   - Polygon: chain ID 137
   - BNB Chain: chain ID 56
2. Miej w portfelu:
   - SKY (po deployu)
   - USDT na tej samej sieci
   - trochę natywnego gas tokena: MATIC lub BNB
3. Dodaj kontrakt SKY do MetaMask po adresie wdrożenia, żeby widzieć saldo.

### Krok 2 — wybierz cenę startową
W puli AMM cena startowa wynika bezpośrednio z proporcji wpłacanych aktywów.

Wzór:
- cena SKY w USDT = `ilość USDT / ilość SKY`

Przykład:
- wpłacasz `10 500 000 SKY` i `21 000 USDT`
- cena startowa = `21 000 / 10 500 000 = 0.002 USDT za 1 SKY`

Jeśli chcesz inną cenę, zmień proporcję:
- więcej USDT względem SKY = wyższa cena startowa
- mniej USDT względem SKY = niższa cena startowa

### Krok 3 — utwórz parę i dodaj płynność
1. Wejdź na DEX, np. PancakeSwap / QuickSwap.
2. Otwórz sekcję `Liquidity` / `Pool`.
3. Wybierz `Add Liquidity` / `Create Pair`.
4. Wskaż token SKY po adresie kontraktu.
5. Wskaż USDT po adresie kontraktu dla danej sieci.
6. Ustaw ilości zgodnie z ceną startową.
7. Jeśli token SKY jest nowy, DEX może zapytać o `Approve` — zatwierdzasz transfer SKY do routera.
8. W MetaMask:
   - kliknij `Approve` dla SKY,
   - potwierdź transakcję gas fee,
   - jeśli USDT też wymaga zatwierdzenia, potwierdź drugi `Approve`.
9. Po zatwierdzeniach kliknij `Supply` / `Add Liquidity`.
10. Potwierdź końcową transakcję w MetaMask.

### Krok 4 — co dzieje się po zatwierdzeniu
- DEX blokuje Twoje tokeny w puli.
- Otrzymujesz LP tokeny / pozycję płynności jako dowód własności.
- Cena rynkowa SKY jest od tej chwili ustalana przez handel w puli.

### Krok 5 — praktyczne zalecenia
- Jeśli chcesz zachować kontrolę nad ceną początkową, nie dawaj za mało płynności.
- Zabezpiecz część SKY na airdrop i marketing przed wrzuceniem wszystkiego do LP.
- Rozważ zablokowanie LP tokenów, jeśli chcesz zwiększyć zaufanie rynku.

---

## 3) Airdrop / masowa wysyłka tokenów

Najprostsze rozwiązanie: użyj zewnętrznego narzędzia typu Disperse albo własnego multisend contract.

### Opcja A — Disperse / narzędzie multisend
1. Otwórz narzędzie do batch transferów dla ERC-20.
2. Połącz MetaMask na tej samej sieci.
3. Wklej listę adresów i kwot.
4. Zatwierdź `Approve` dla kontraktu narzędzia, żeby mógł wysłać Twoje SKY.
5. Uruchom batch transfer.
6. Sprawdź transakcję na explorerze.

Format listy adresów zwykle wygląda tak:

```text
0x1111111111111111111111111111111111111111,1000
0x2222222222222222222222222222222222222222,2500
0x3333333333333333333333333333333333333333,750
```

Ważne:
- Kwoty podawaj w jednostkach zgodnych z narzędziem; czasem są to pełne tokeny, czasem najmniejsze jednostki. Sprawdź opis importu w narzędziu przed wysyłką.
- Dla setek adresów zwróć uwagę na limity gas i maksymalną liczbę odbiorców na jedną transakcję.

### Opcja B — własny kontrakt Multisend
Jeśli chcesz wysyłać z własnego kontraktu, użyj prostego batch transferu.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SkybitMultisend {
    using SafeERC20 for IERC20;

    function batchTransfer(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        require(recipients.length == amounts.length, "Length mismatch");

        IERC20 t = IERC20(token);

        for (uint256 i = 0; i < recipients.length; i++) {
            t.safeTransferFrom(msg.sender, recipients[i], amounts[i]);
        }
    }
}
```

Jak tego użyć:
1. Właściciel SKY robi `approve` dla kontraktu Multisend na potrzebną sumę.
2. Wywołuje `batchTransfer(...)` z listą adresów i kwot.
3. Kontrakt rozsyła tokeny w pętli.

Format danych:
- `recipients`: tablica adresów
- `amounts`: tablica kwot w najmniejszych jednostkach tokena

Przykład:
- `1000 SKY` = `1000 * 10^18`
- `2500 SKY` = `2500 * 10^18`

---

## Rekomendacja praktyczna
Jeśli zależy Ci na prostocie, wybierz:
- deploy SKY jako stałej podaży,
- LP na DEX w parze SKY/USDT,
- airdrop przez multisend tool do małej/średniej listy,
- multisend contract, jeśli chcesz automatyzację i pełną kontrolę.
