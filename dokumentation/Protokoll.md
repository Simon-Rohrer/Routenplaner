Protokoll
Alle Brainstorming
Seb CSV Dateien/Datenbankverwaltung
Simon Erstellen der Ordnerstrucktur vom Projekt
Simon Erstellen des ersten Codes das die Mapanzeigt
Simon Optische änderungen der Oberfläche
Seb Verbindung der CSV einbindung in den Programmcode

110 x 11
2 Hidden Terminals
Ich schaue mir jetzt den genauen Fehler an und passe die Konfiguration an die tatsächliche Python-Installation im System an.

Ich suche jetzt nach einer vollständigen Python-Installation auf dem Rechner und ziehe die Launch-Konfiguration auf den echten Pfad um.

Die Ursache ist klar: Auf dem Rechner ist aktuell nur der Windows-App-Stub von Python vorhanden, kein echter Interpreter. Ich installiere jetzt eine reale Python-Version, damit Run-and-Debug zuverlässig startet.

python --version
 Enable shell integration to improve command detection

Die Installation läuft gerade weiter; ich warte kurz auf den Abschluss und prüfe danach sofort, ob der Interpreter verfügbar ist.

Ich ziehe die Konfiguration jetzt auf den tatsächlich installierten Python-Pfad um und setze ihn zusätzlich als Standard-Interpreter für den Workspace.

Die Konfiguration nutzt jetzt den echten Python-Interpreter direkt. Ich starte das Projekt anschließend einmal mit diesem Pfad, um sicherzustellen, dass es wirklich läuft.

Set-Location 'c:\Users\seb30\Desktop\Logistik Projekt\Routenplaner'; & 'C:\Users\seb30\AppDa