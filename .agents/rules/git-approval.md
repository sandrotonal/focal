# Git Push & Commit Approval Policy

- **ASLA VE HİÇBİR KOŞULDA** kullanıcıdan o konuşma adımında açık, net ve teyitli onay almadan `git push`, `git push --force` veya `git commit` komutları çalıştırılamaz.
- Kullanıcı doğrudan "şimdi pushla" veya "onaylıyorum pushla" demediği sürece yapılan tüm kod ve konfigürasyon değişiklikleri **YALNIZCA YEREL (LOCAL)** çalışma alanında tutulacaktır.
- Kullanıcı onay verse dahi, asla doğrudan `main` veya `master` branch'ine push yapılmayacaktır; sadece belirlenen feature branch'ine push yapılabilir.
- Herhangi bir git commit/push işlemi öncesinde kullanıcıya yapılacak işlem bildirilip onay istenmelidir.
