/** Read-only built-in electrical symbol metadata. Snapshot of src/register/fachzeichen.ts.
 * Client-side custom symbols are NOT included; tests enforce registry parity.
 * Symbols are intended for learning and do not certify compliance with IEC norms.
 */
export type CloudSymbol={id:string;name:string;gruppe:string;kennbuchstabe:string;w:number;h:number;anschluesse:{nr:string;x:number;y:number}[]};
export const BUILTIN_SYMBOLS:readonly CloudSymbol[]=[
  {
    "id": "schliesser",
    "name": "Schliesser",
    "gruppe": "kontakte",
    "kennbuchstabe": "S",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 0
      },
      {
        "nr": "4",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "oeffner",
    "name": "Öffner",
    "gruppe": "kontakte",
    "kennbuchstabe": "S",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "wechsler",
    "name": "Wechsler",
    "gruppe": "kontakte",
    "kennbuchstabe": "S",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "11",
        "x": 30,
        "y": 60
      },
      {
        "nr": "12",
        "x": 10,
        "y": 0
      },
      {
        "nr": "14",
        "x": 50,
        "y": 0
      }
    ]
  },
  {
    "id": "taster-schliesser",
    "name": "Taster (Schliesser)",
    "gruppe": "schalter",
    "kennbuchstabe": "S",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 0
      },
      {
        "nr": "4",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "taster-oeffner",
    "name": "Taster (Öffner)",
    "gruppe": "schalter",
    "kennbuchstabe": "S",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "ausschalter",
    "name": "Ausschalter",
    "gruppe": "schalter",
    "kennbuchstabe": "S",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "wechselschalter",
    "name": "Wechselschalter",
    "gruppe": "schalter",
    "kennbuchstabe": "S",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "L",
        "x": 30,
        "y": 60
      },
      {
        "nr": "1",
        "x": 10,
        "y": 0
      },
      {
        "nr": "2",
        "x": 50,
        "y": 0
      }
    ]
  },
  {
    "id": "kreuzschalter",
    "name": "Kreuzschalter",
    "gruppe": "schalter",
    "kennbuchstabe": "S",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 10,
        "y": 0
      },
      {
        "nr": "2",
        "x": 50,
        "y": 0
      },
      {
        "nr": "3",
        "x": 10,
        "y": 60
      },
      {
        "nr": "4",
        "x": 50,
        "y": 60
      }
    ]
  },
  {
    "id": "serienschalter",
    "name": "Serienschalter",
    "gruppe": "schalter",
    "kennbuchstabe": "S",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "L",
        "x": 30,
        "y": 60
      },
      {
        "nr": "1",
        "x": 10,
        "y": 0
      },
      {
        "nr": "2",
        "x": 50,
        "y": 0
      }
    ]
  },
  {
    "id": "hauptschalter",
    "name": "Hauptschalter",
    "gruppe": "schalter",
    "kennbuchstabe": "Q",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 10,
        "y": 0
      },
      {
        "nr": "3",
        "x": 30,
        "y": 0
      },
      {
        "nr": "5",
        "x": 50,
        "y": 0
      },
      {
        "nr": "2",
        "x": 10,
        "y": 60
      },
      {
        "nr": "4",
        "x": 30,
        "y": 60
      },
      {
        "nr": "6",
        "x": 50,
        "y": 60
      }
    ]
  },
  {
    "id": "notaus",
    "name": "Not-Halt",
    "gruppe": "schalter",
    "kennbuchstabe": "S",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "endschalter",
    "name": "Positionsschalter",
    "gruppe": "schalter",
    "kennbuchstabe": "S",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 0
      },
      {
        "nr": "4",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "spule",
    "name": "Relaisspule",
    "gruppe": "relais",
    "kennbuchstabe": "K",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "A1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "A2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "spule-anzugsverzoegert",
    "name": "Zeitrelais, anzugsverzögert",
    "gruppe": "relais",
    "kennbuchstabe": "K",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "A1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "A2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "spule-abfallverzoegert",
    "name": "Zeitrelais, abfallverzögert",
    "gruppe": "relais",
    "kennbuchstabe": "K",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "A1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "A2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "schuetz-hauptkontakt",
    "name": "Schütz-Hauptkontakt",
    "gruppe": "relais",
    "kennbuchstabe": "K",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "schuetz-schliesser",
    "name": "Schütz-Schliesser (Hilfskontakt)",
    "gruppe": "relais",
    "kennbuchstabe": "K",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "13",
        "x": 20,
        "y": 0
      },
      {
        "nr": "14",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "schuetz-oeffner",
    "name": "Schütz-Öffner (Hilfskontakt)",
    "gruppe": "relais",
    "kennbuchstabe": "K",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "21",
        "x": 20,
        "y": 0
      },
      {
        "nr": "22",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "sicherung",
    "name": "Sicherung",
    "gruppe": "schutz",
    "kennbuchstabe": "F",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "leitungsschutzschalter",
    "name": "Leitungsschutzschalter",
    "gruppe": "schutz",
    "kennbuchstabe": "F",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "fi-schutzschalter",
    "name": "Fehlerstrom-Schutzschalter",
    "gruppe": "schutz",
    "kennbuchstabe": "F",
    "w": 60,
    "h": 70,
    "anschluesse": [
      {
        "nr": "1",
        "x": 10,
        "y": 0
      },
      {
        "nr": "3",
        "x": 30,
        "y": 0
      },
      {
        "nr": "N",
        "x": 50,
        "y": 0
      },
      {
        "nr": "2",
        "x": 10,
        "y": 70
      },
      {
        "nr": "4",
        "x": 30,
        "y": 70
      },
      {
        "nr": "N2",
        "x": 50,
        "y": 70
      }
    ]
  },
  {
    "id": "motorschutzschalter",
    "name": "Motorschutzschalter",
    "gruppe": "schutz",
    "kennbuchstabe": "Q",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 10,
        "y": 0
      },
      {
        "nr": "3",
        "x": 30,
        "y": 0
      },
      {
        "nr": "5",
        "x": 50,
        "y": 0
      },
      {
        "nr": "2",
        "x": 10,
        "y": 60
      },
      {
        "nr": "4",
        "x": 30,
        "y": 60
      },
      {
        "nr": "6",
        "x": 50,
        "y": 60
      }
    ]
  },
  {
    "id": "thermorelais",
    "name": "Thermisches Überlastrelais",
    "gruppe": "schutz",
    "kennbuchstabe": "F",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 10,
        "y": 0
      },
      {
        "nr": "3",
        "x": 30,
        "y": 0
      },
      {
        "nr": "5",
        "x": 50,
        "y": 0
      },
      {
        "nr": "2",
        "x": 10,
        "y": 60
      },
      {
        "nr": "4",
        "x": 30,
        "y": 60
      },
      {
        "nr": "6",
        "x": 50,
        "y": 60
      }
    ]
  },
  {
    "id": "ueberspannungsableiter",
    "name": "Überspannungsableiter",
    "gruppe": "schutz",
    "kennbuchstabe": "F",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "PE",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "motor-drehstrom",
    "name": "Drehstrommotor",
    "gruppe": "motoren",
    "kennbuchstabe": "M",
    "w": 60,
    "h": 70,
    "anschluesse": [
      {
        "nr": "U1",
        "x": 10,
        "y": 0
      },
      {
        "nr": "V1",
        "x": 30,
        "y": 0
      },
      {
        "nr": "W1",
        "x": 50,
        "y": 0
      }
    ]
  },
  {
    "id": "motor-klemmenbrett",
    "name": "Klemmenbrett Motor",
    "gruppe": "motoren",
    "kennbuchstabe": "M",
    "w": 140,
    "h": 90,
    "anschluesse": [
      {
        "nr": "U1",
        "x": 10,
        "y": 0
      },
      {
        "nr": "V1",
        "x": 50,
        "y": 0
      },
      {
        "nr": "W1",
        "x": 90,
        "y": 0
      },
      {
        "nr": "W2",
        "x": 50,
        "y": 90
      },
      {
        "nr": "U2",
        "x": 90,
        "y": 90
      },
      {
        "nr": "V2",
        "x": 130,
        "y": 90
      },
      {
        "nr": "PE",
        "x": 10,
        "y": 90
      }
    ]
  },
  {
    "id": "motor-wechselstrom",
    "name": "Wechselstrommotor",
    "gruppe": "motoren",
    "kennbuchstabe": "M",
    "w": 60,
    "h": 70,
    "anschluesse": [
      {
        "nr": "U1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "U2",
        "x": 40,
        "y": 0
      }
    ]
  },
  {
    "id": "motor-gleichstrom",
    "name": "Gleichstrommotor",
    "gruppe": "motoren",
    "kennbuchstabe": "M",
    "w": 60,
    "h": 70,
    "anschluesse": [
      {
        "nr": "A1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "A2",
        "x": 40,
        "y": 0
      }
    ]
  },
  {
    "id": "generator",
    "name": "Generator",
    "gruppe": "motoren",
    "kennbuchstabe": "G",
    "w": 60,
    "h": 70,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 40,
        "y": 0
      }
    ]
  },
  {
    "id": "voltmeter",
    "name": "Voltmeter",
    "gruppe": "messen",
    "kennbuchstabe": "P",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "+",
        "x": 0,
        "y": 30
      },
      {
        "nr": "−",
        "x": 60,
        "y": 30
      }
    ]
  },
  {
    "id": "amperemeter",
    "name": "Amperemeter",
    "gruppe": "messen",
    "kennbuchstabe": "P",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "+",
        "x": 0,
        "y": 30
      },
      {
        "nr": "−",
        "x": 60,
        "y": 30
      }
    ]
  },
  {
    "id": "ohmmeter",
    "name": "Ohmmeter",
    "gruppe": "messen",
    "kennbuchstabe": "P",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 0,
        "y": 30
      },
      {
        "nr": "2",
        "x": 60,
        "y": 30
      }
    ]
  },
  {
    "id": "wattmeter",
    "name": "Wattmeter",
    "gruppe": "messen",
    "kennbuchstabe": "P",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 0,
        "y": 30
      },
      {
        "nr": "2",
        "x": 60,
        "y": 30
      }
    ]
  },
  {
    "id": "zaehler",
    "name": "Energiezähler",
    "gruppe": "messen",
    "kennbuchstabe": "P",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 0,
        "y": 30
      },
      {
        "nr": "2",
        "x": 60,
        "y": 30
      }
    ]
  },
  {
    "id": "frequenzmesser",
    "name": "Frequenzmesser",
    "gruppe": "messen",
    "kennbuchstabe": "P",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 0,
        "y": 30
      },
      {
        "nr": "2",
        "x": 60,
        "y": 30
      }
    ]
  },
  {
    "id": "naeherungsschalter",
    "name": "Näherungsschalter",
    "gruppe": "sensoren",
    "kennbuchstabe": "B",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 30,
        "y": 0
      },
      {
        "nr": "4",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "temperaturfuehler",
    "name": "Temperaturfühler",
    "gruppe": "sensoren",
    "kennbuchstabe": "B",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 30,
        "y": 0
      },
      {
        "nr": "2",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "drucksensor",
    "name": "Druckschalter",
    "gruppe": "sensoren",
    "kennbuchstabe": "B",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "lichtschranke",
    "name": "Lichtschranke",
    "gruppe": "sensoren",
    "kennbuchstabe": "B",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 10,
        "y": 60
      },
      {
        "nr": "4",
        "x": 50,
        "y": 60
      }
    ]
  },
  {
    "id": "bewegungsmelder",
    "name": "Bewegungsmelder",
    "gruppe": "sensoren",
    "kennbuchstabe": "B",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "L",
        "x": 30,
        "y": 0
      },
      {
        "nr": "L′",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "batterie",
    "name": "Batterie",
    "gruppe": "quellen",
    "kennbuchstabe": "G",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "+",
        "x": 20,
        "y": 0
      },
      {
        "nr": "−",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "gleichspannung",
    "name": "Gleichspannungsquelle",
    "gruppe": "quellen",
    "kennbuchstabe": "G",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "+",
        "x": 30,
        "y": 0
      },
      {
        "nr": "−",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "wechselspannung",
    "name": "Wechselspannungsquelle",
    "gruppe": "quellen",
    "kennbuchstabe": "G",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "L",
        "x": 30,
        "y": 0
      },
      {
        "nr": "N",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "drehstromquelle",
    "name": "Drehstromquelle 3 × 400/230 V",
    "gruppe": "quellen",
    "kennbuchstabe": "G",
    "w": 160,
    "h": 80,
    "anschluesse": [
      {
        "nr": "L1",
        "x": 10,
        "y": 80
      },
      {
        "nr": "L2",
        "x": 40,
        "y": 80
      },
      {
        "nr": "L3",
        "x": 70,
        "y": 80
      },
      {
        "nr": "N",
        "x": 100,
        "y": 80
      },
      {
        "nr": "PE",
        "x": 130,
        "y": 80
      }
    ]
  },
  {
    "id": "erde",
    "name": "Erde",
    "gruppe": "quellen",
    "kennbuchstabe": "E",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "E",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "schutzleiter",
    "name": "Schutzleiter PE",
    "gruppe": "quellen",
    "kennbuchstabe": "PE",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "PE",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "masse",
    "name": "Masse",
    "gruppe": "quellen",
    "kennbuchstabe": "M",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "M",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "widerstand",
    "name": "Widerstand",
    "gruppe": "passiv",
    "kennbuchstabe": "R",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "potentiometer",
    "name": "Potentiometer",
    "gruppe": "passiv",
    "kennbuchstabe": "R",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      },
      {
        "nr": "S",
        "x": 60,
        "y": 30
      }
    ]
  },
  {
    "id": "kondensator",
    "name": "Kondensator",
    "gruppe": "passiv",
    "kennbuchstabe": "C",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "elko",
    "name": "Elektrolytkondensator",
    "gruppe": "passiv",
    "kennbuchstabe": "C",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "+",
        "x": 20,
        "y": 0
      },
      {
        "nr": "−",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "spule-induktivitaet",
    "name": "Spule",
    "gruppe": "passiv",
    "kennbuchstabe": "L",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "transformator",
    "name": "Transformator",
    "gruppe": "passiv",
    "kennbuchstabe": "T",
    "w": 70,
    "h": 70,
    "anschluesse": [
      {
        "nr": "1U",
        "x": 20,
        "y": 0
      },
      {
        "nr": "1V",
        "x": 20,
        "y": 70
      },
      {
        "nr": "2U",
        "x": 50,
        "y": 0
      },
      {
        "nr": "2V",
        "x": 50,
        "y": 70
      }
    ]
  },
  {
    "id": "diode",
    "name": "Diode",
    "gruppe": "halbleiter",
    "kennbuchstabe": "V",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "A",
        "x": 20,
        "y": 0
      },
      {
        "nr": "K",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "led",
    "name": "Leuchtdiode",
    "gruppe": "halbleiter",
    "kennbuchstabe": "V",
    "w": 50,
    "h": 60,
    "anschluesse": [
      {
        "nr": "A",
        "x": 20,
        "y": 0
      },
      {
        "nr": "K",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "zenerdiode",
    "name": "Z-Diode",
    "gruppe": "halbleiter",
    "kennbuchstabe": "V",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "A",
        "x": 20,
        "y": 0
      },
      {
        "nr": "K",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "ptc",
    "name": "PTC / Kaltleiter",
    "gruppe": "halbleiter",
    "kennbuchstabe": "R",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "ntc",
    "name": "NTC / Heissleiter",
    "gruppe": "halbleiter",
    "kennbuchstabe": "R",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "vdr",
    "name": "VDR / Varistor",
    "gruppe": "halbleiter",
    "kennbuchstabe": "R",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "ldr",
    "name": "LDR / Fotowiderstand",
    "gruppe": "halbleiter",
    "kennbuchstabe": "R",
    "w": 50,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "optokoppler",
    "name": "Optokoppler",
    "gruppe": "halbleiter",
    "kennbuchstabe": "V",
    "w": 80,
    "h": 70,
    "anschluesse": [
      {
        "nr": "A",
        "x": 20,
        "y": 0
      },
      {
        "nr": "K",
        "x": 20,
        "y": 70
      },
      {
        "nr": "C",
        "x": 60,
        "y": 0
      },
      {
        "nr": "E",
        "x": 60,
        "y": 70
      }
    ]
  },
  {
    "id": "triac",
    "name": "Triac",
    "gruppe": "halbleiter",
    "kennbuchstabe": "V",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "A1",
        "x": 20,
        "y": 60
      },
      {
        "nr": "A2",
        "x": 20,
        "y": 0
      },
      {
        "nr": "G",
        "x": 60,
        "y": 30
      }
    ]
  },
  {
    "id": "transistor-npn",
    "name": "Transistor NPN",
    "gruppe": "halbleiter",
    "kennbuchstabe": "V",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "B",
        "x": 0,
        "y": 30
      },
      {
        "nr": "C",
        "x": 40,
        "y": 0
      },
      {
        "nr": "E",
        "x": 40,
        "y": 60
      }
    ]
  },
  {
    "id": "transistor-pnp",
    "name": "Transistor PNP",
    "gruppe": "halbleiter",
    "kennbuchstabe": "V",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "B",
        "x": 0,
        "y": 30
      },
      {
        "nr": "C",
        "x": 40,
        "y": 0
      },
      {
        "nr": "E",
        "x": 40,
        "y": 60
      }
    ]
  },
  {
    "id": "thyristor",
    "name": "Thyristor",
    "gruppe": "halbleiter",
    "kennbuchstabe": "V",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "A",
        "x": 20,
        "y": 0
      },
      {
        "nr": "K",
        "x": 20,
        "y": 60
      },
      {
        "nr": "G",
        "x": 60,
        "y": 30
      }
    ]
  },
  {
    "id": "lampe",
    "name": "Lampe",
    "gruppe": "melder",
    "kennbuchstabe": "E",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "X1",
        "x": 30,
        "y": 0
      },
      {
        "nr": "X2",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "signalleuchte",
    "name": "Meldeleuchte",
    "gruppe": "melder",
    "kennbuchstabe": "P",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "X1",
        "x": 30,
        "y": 0
      },
      {
        "nr": "X2",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "hupe",
    "name": "Hupe",
    "gruppe": "melder",
    "kennbuchstabe": "P",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "X1",
        "x": 30,
        "y": 0
      },
      {
        "nr": "X2",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "klingel",
    "name": "Klingel",
    "gruppe": "melder",
    "kennbuchstabe": "P",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "X1",
        "x": 30,
        "y": 0
      },
      {
        "nr": "X2",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "steckdose",
    "name": "Steckdose",
    "gruppe": "stecker",
    "kennbuchstabe": "X",
    "w": 60,
    "h": 40,
    "anschluesse": [
      {
        "nr": "L",
        "x": 20,
        "y": 0
      },
      {
        "nr": "N",
        "x": 40,
        "y": 0
      }
    ]
  },
  {
    "id": "steckdose-schuko",
    "name": "Steckdose mit Schutzkontakt",
    "gruppe": "stecker",
    "kennbuchstabe": "X",
    "w": 60,
    "h": 40,
    "anschluesse": [
      {
        "nr": "L",
        "x": 10,
        "y": 0
      },
      {
        "nr": "N",
        "x": 30,
        "y": 0
      },
      {
        "nr": "PE",
        "x": 50,
        "y": 0
      }
    ]
  },
  {
    "id": "stecker",
    "name": "Stecker",
    "gruppe": "stecker",
    "kennbuchstabe": "X",
    "w": 40,
    "h": 50,
    "anschluesse": [
      {
        "nr": "L",
        "x": 10,
        "y": 0
      },
      {
        "nr": "N",
        "x": 30,
        "y": 0
      }
    ]
  },
  {
    "id": "steckverbindung",
    "name": "Steckverbindung",
    "gruppe": "stecker",
    "kennbuchstabe": "X",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "klemme",
    "name": "Klemme",
    "gruppe": "stecker",
    "kennbuchstabe": "X",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 40
      }
    ]
  },
  {
    "id": "abzweigdose",
    "name": "Abzweigdose",
    "gruppe": "stecker",
    "kennbuchstabe": "X",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 30,
        "y": 0
      },
      {
        "nr": "2",
        "x": 30,
        "y": 60
      },
      {
        "nr": "3",
        "x": 0,
        "y": 30
      },
      {
        "nr": "4",
        "x": 60,
        "y": 30
      }
    ]
  },
  {
    "id": "verbindungspunkt",
    "name": "Verbindungspunkt",
    "gruppe": "leitungen",
    "kennbuchstabe": "",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "",
        "x": 20,
        "y": 0
      },
      {
        "nr": "",
        "x": 20,
        "y": 40
      },
      {
        "nr": "",
        "x": 0,
        "y": 20
      },
      {
        "nr": "",
        "x": 40,
        "y": 20
      }
    ]
  },
  {
    "id": "kreuzung",
    "name": "Kreuzung ohne Verbindung",
    "gruppe": "leitungen",
    "kennbuchstabe": "",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "",
        "x": 20,
        "y": 0
      },
      {
        "nr": "",
        "x": 20,
        "y": 40
      },
      {
        "nr": "",
        "x": 0,
        "y": 20
      },
      {
        "nr": "",
        "x": 40,
        "y": 20
      }
    ]
  },
  {
    "id": "leiter-l1",
    "name": "Aussenleiter L1",
    "gruppe": "leitungen",
    "kennbuchstabe": "L1",
    "w": 60,
    "h": 30,
    "anschluesse": [
      {
        "nr": "L1",
        "x": 0,
        "y": 20
      },
      {
        "nr": "L1",
        "x": 60,
        "y": 20
      }
    ]
  },
  {
    "id": "leiter-l2",
    "name": "Aussenleiter L2",
    "gruppe": "leitungen",
    "kennbuchstabe": "L2",
    "w": 60,
    "h": 30,
    "anschluesse": [
      {
        "nr": "L2",
        "x": 0,
        "y": 20
      },
      {
        "nr": "L2",
        "x": 60,
        "y": 20
      }
    ]
  },
  {
    "id": "leiter-l3",
    "name": "Aussenleiter L3",
    "gruppe": "leitungen",
    "kennbuchstabe": "L3",
    "w": 60,
    "h": 30,
    "anschluesse": [
      {
        "nr": "L3",
        "x": 0,
        "y": 20
      },
      {
        "nr": "L3",
        "x": 60,
        "y": 20
      }
    ]
  },
  {
    "id": "leiter-n",
    "name": "Neutralleiter N",
    "gruppe": "leitungen",
    "kennbuchstabe": "N",
    "w": 60,
    "h": 30,
    "anschluesse": [
      {
        "nr": "N",
        "x": 0,
        "y": 20
      },
      {
        "nr": "N",
        "x": 60,
        "y": 20
      }
    ]
  },
  {
    "id": "leiter-pe",
    "name": "Schutzleiter PE",
    "gruppe": "leitungen",
    "kennbuchstabe": "PE",
    "w": 60,
    "h": 30,
    "anschluesse": [
      {
        "nr": "PE",
        "x": 0,
        "y": 20
      },
      {
        "nr": "PE",
        "x": 60,
        "y": 20
      }
    ]
  },
  {
    "id": "ch-schema0",
    "name": "Ausschalter Schema 0",
    "gruppe": "ch-schema",
    "kennbuchstabe": "Q",
    "w": 40,
    "h": 60,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 0
      },
      {
        "nr": "4",
        "x": 20,
        "y": 60
      }
    ]
  },
  {
    "id": "ch-schema1",
    "name": "Serienschalter Schema 1",
    "gruppe": "ch-schema",
    "kennbuchstabe": "Q",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "3",
        "x": 30,
        "y": 60
      },
      {
        "nr": "4",
        "x": 10,
        "y": 0
      },
      {
        "nr": "5",
        "x": 50,
        "y": 0
      }
    ]
  },
  {
    "id": "ch-schema2",
    "name": "Gruppenschalter Schema 2",
    "gruppe": "ch-schema",
    "kennbuchstabe": "Q",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "3",
        "x": 30,
        "y": 60
      },
      {
        "nr": "4",
        "x": 10,
        "y": 0
      },
      {
        "nr": "5",
        "x": 50,
        "y": 0
      }
    ]
  },
  {
    "id": "ch-schema3",
    "name": "Wechselschalter Schema 3",
    "gruppe": "ch-schema",
    "kennbuchstabe": "Q",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "3",
        "x": 30,
        "y": 60
      },
      {
        "nr": "1",
        "x": 10,
        "y": 0
      },
      {
        "nr": "2",
        "x": 50,
        "y": 0
      }
    ]
  },
  {
    "id": "ch-schema6",
    "name": "Kreuzschalter Schema 6",
    "gruppe": "ch-schema",
    "kennbuchstabe": "Q",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 10,
        "y": 0
      },
      {
        "nr": "2",
        "x": 50,
        "y": 0
      },
      {
        "nr": "3",
        "x": 10,
        "y": 60
      },
      {
        "nr": "4",
        "x": 50,
        "y": 60
      }
    ]
  },
  {
    "id": "ch-kontrolllampe",
    "name": "Kontrolllampe",
    "gruppe": "ch-schema",
    "kennbuchstabe": "E",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "X1",
        "x": 30,
        "y": 0
      },
      {
        "nr": "X2",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "ch-orientierungslampe",
    "name": "Orientierungslampe",
    "gruppe": "ch-schema",
    "kennbuchstabe": "E",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "X1",
        "x": 30,
        "y": 0
      },
      {
        "nr": "X2",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "ch-druck",
    "name": "Betätigung: Drücken",
    "gruppe": "ch-schema",
    "kennbuchstabe": "",
    "w": 40,
    "h": 30,
    "anschluesse": [
      {
        "nr": "",
        "x": 20,
        "y": 30
      }
    ]
  },
  {
    "id": "ch-dreh",
    "name": "Betätigung: Drehen",
    "gruppe": "ch-schema",
    "kennbuchstabe": "",
    "w": 40,
    "h": 30,
    "anschluesse": [
      {
        "nr": "",
        "x": 20,
        "y": 30
      }
    ]
  },
  {
    "id": "ch-kipp",
    "name": "Betätigung: Kippen",
    "gruppe": "ch-schema",
    "kennbuchstabe": "",
    "w": 40,
    "h": 30,
    "anschluesse": [
      {
        "nr": "",
        "x": 20,
        "y": 30
      }
    ]
  },
  {
    "id": "ch-zug",
    "name": "Betätigung: Ziehen",
    "gruppe": "ch-schema",
    "kennbuchstabe": "",
    "w": 40,
    "h": 30,
    "anschluesse": [
      {
        "nr": "",
        "x": 20,
        "y": 30
      }
    ]
  },
  {
    "id": "ch-schluessel",
    "name": "Betätigung: Schlüssel",
    "gruppe": "ch-schema",
    "kennbuchstabe": "",
    "w": 40,
    "h": 30,
    "anschluesse": [
      {
        "nr": "",
        "x": 20,
        "y": 30
      }
    ]
  },
  {
    "id": "bp-schalter-up",
    "name": "Bauplan: UP-Schalter (allgemein)",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "Q",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 40
      }
    ]
  },
  {
    "id": "bp-schalter-ap",
    "name": "Bauplan: AP-Schalter (allgemein)",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "Q",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 40
      }
    ]
  },
  {
    "id": "bp-schalter0",
    "name": "Bauplan: Schalter Sch 0",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "Q",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 40
      }
    ]
  },
  {
    "id": "bp-schalter1",
    "name": "Bauplan: Schalter Sch 1",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "Q",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 40
      }
    ]
  },
  {
    "id": "bp-schalter3",
    "name": "Bauplan: Schalter Sch 3",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "Q",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 40
      }
    ]
  },
  {
    "id": "bp-schalter6",
    "name": "Bauplan: Schalter Sch 6",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "Q",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 40
      }
    ]
  },
  {
    "id": "bp-zugschalter",
    "name": "Bauplan: Zugschalter",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "Q",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 40
      }
    ]
  },
  {
    "id": "bp-nachlauf",
    "name": "Bauplan: Schalter mit Nachlauf",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "Q",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 40
      }
    ]
  },
  {
    "id": "bp-lichtregler",
    "name": "Bauplan: Lichtregler (Dimmer)",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "Q",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 40
      }
    ]
  },
  {
    "id": "bp-taster",
    "name": "Bauplan: Taster",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "S",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 40
      }
    ]
  },
  {
    "id": "bp-storenschalter",
    "name": "Bauplan: Storenschalter",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "S",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 40
      }
    ]
  },
  {
    "id": "bp-kombi-0",
    "name": "Bauplan: Kombi Gr.1 Sch 0 / Steckdose",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "Q",
    "w": 50,
    "h": 50,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 50
      }
    ]
  },
  {
    "id": "bp-kombi-3",
    "name": "Bauplan: Kombi Gr.1 Sch 3 / Steckdose",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "Q",
    "w": 50,
    "h": 50,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 50
      }
    ]
  },
  {
    "id": "bp-kombi-taster",
    "name": "Bauplan: Kombi Gr.1 Taster / Steckdose",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "S",
    "w": 50,
    "h": 50,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 50
      }
    ]
  },
  {
    "id": "bp-kombi-3-gr11",
    "name": "Bauplan: Kombi Gr.1+1 Sch 3 / Steckdose",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "Q",
    "w": 50,
    "h": 50,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 50
      }
    ]
  },
  {
    "id": "bp-t13",
    "name": "Bauplan: Steckdose Typ 13",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "X",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "L",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-t13-3fach",
    "name": "Bauplan: Steckdose Typ 13 3-fach",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "X",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "L",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-t13-3fach-s",
    "name": "Bauplan: Steckdose Typ 13 3-fach, 1 geschaltet",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "X",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "L",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-t23",
    "name": "Bauplan: Steckdose Typ 23",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "X",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "L",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-t23-3fach",
    "name": "Bauplan: Steckdose Typ 23 3-fach",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "X",
    "w": 60,
    "h": 40,
    "anschluesse": [
      {
        "nr": "L",
        "x": 30,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-t25",
    "name": "Bauplan: Steckdose Typ 25",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "X",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "L",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-abzweigdose",
    "name": "Bauplan: Abzweigdose",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "X",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      },
      {
        "nr": "2",
        "x": 20,
        "y": 40
      },
      {
        "nr": "3",
        "x": 0,
        "y": 20
      },
      {
        "nr": "4",
        "x": 40,
        "y": 20
      }
    ]
  },
  {
    "id": "bp-bodendose",
    "name": "Bauplan: Bodendose",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "X",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "1",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-lampenduebel",
    "name": "Bauplan: Lampendübel",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "E",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "X1",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-leuchtstelle",
    "name": "Bauplan: Deckenleuchte",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "E",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "X1",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-leuchte",
    "name": "Bauplan: Leuchte länglich",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "E",
    "w": 60,
    "h": 40,
    "anschluesse": [
      {
        "nr": "X1",
        "x": 0,
        "y": 20
      },
      {
        "nr": "X2",
        "x": 60,
        "y": 20
      }
    ]
  },
  {
    "id": "bp-einbauleuchte",
    "name": "Bauplan: Decken-Einbauleuchte",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "E",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "X1",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-wandleuchte",
    "name": "Bauplan: Wandleuchte",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "E",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "X1",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-pir",
    "name": "Bauplan: PIR-Melder",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "B",
    "w": 60,
    "h": 40,
    "anschluesse": [
      {
        "nr": "L",
        "x": 60,
        "y": 20
      }
    ]
  },
  {
    "id": "bp-store",
    "name": "Bauplan: Lamellenstore",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "M",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "M",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-ventilator",
    "name": "Bauplan: Abluftventilator",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "M",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "M",
        "x": 20,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-direktanschluss",
    "name": "Bauplan: Direktanschluss",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "X",
    "w": 20,
    "h": 20,
    "anschluesse": [
      {
        "nr": "L",
        "x": 10,
        "y": 0
      }
    ]
  },
  {
    "id": "bp-verteiler",
    "name": "Bauplan: Unterverteilung",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "W",
    "w": 60,
    "h": 40,
    "anschluesse": [
      {
        "nr": "L",
        "x": 0,
        "y": 20
      }
    ]
  },
  {
    "id": "bp-minuterie",
    "name": "Minuterie (Treppenhausautomat)",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "K",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "1",
        "x": 30,
        "y": 0
      },
      {
        "nr": "2",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "bp-daemmerung",
    "name": "Dämmerungsschalter",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "B",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "L",
        "x": 30,
        "y": 0
      },
      {
        "nr": "L′",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "bp-sonnerie",
    "name": "Bauplan: Sonnerieglocke",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "P",
    "w": 60,
    "h": 60,
    "anschluesse": [
      {
        "nr": "X1",
        "x": 30,
        "y": 0
      },
      {
        "nr": "X2",
        "x": 30,
        "y": 60
      }
    ]
  },
  {
    "id": "bp-sonneriedruck",
    "name": "Bauplan: Sonnerietaster",
    "gruppe": "ch-bauplan",
    "kennbuchstabe": "S",
    "w": 40,
    "h": 40,
    "anschluesse": [
      {
        "nr": "3",
        "x": 20,
        "y": 40
      }
    ]
  }
];
