import type { Station, Line, Segment } from './types.ts'

export const stations: Station[] = [
  {
    "id": "chimpu-ocllo",
    "name": "Chimpu Ocllo",
    "lat": -11.896386,
    "lng": -77.03743,
    "polygon": [
      [
        -11.896539,
        -77.03743
      ],
      [
        -11.896498,
        -77.037507
      ],
      [
        -11.896323,
        -77.037434
      ],
      [
        -11.896347,
        -77.037342
      ],
      [
        -11.896539,
        -77.03743
      ]
    ],
    "lineIds": [
      "linea-b"
    ],
    "isTransfer": false
  },
  {
    "id": "los-incas",
    "name": "Los Incas",
    "lat": -11.915449,
    "lng": -77.048052,
    "polygon": [
      [
        -11.915536,
        -77.048062
      ],
      [
        -11.915574,
        -77.048143
      ],
      [
        -11.915283,
        -77.047976
      ],
      [
        -11.915323,
        -77.047936
      ],
      [
        -11.915536,
        -77.048062
      ]
    ],
    "lineIds": [
      "linea-b"
    ],
    "isTransfer": false
  },
  {
    "id": "andres-belaunde",
    "name": "Andrés Belaunde",
    "lat": -11.935048,
    "lng": -77.056403,
    "polygon": [
      [
        -11.935131,
        -77.056406
      ],
      [
        -11.935133,
        -77.056467
      ],
      [
        -11.93497,
        -77.05637
      ],
      [
        -11.934991,
        -77.056329
      ],
      [
        -11.935131,
        -77.056406
      ]
    ],
    "lineIds": [
      "linea-b"
    ],
    "isTransfer": false
  },
  {
    "id": "22-de-agosto",
    "name": "22 de Agosto",
    "lat": -11.946645,
    "lng": -77.060592,
    "polygon": [
      [
        -11.946824,
        -77.060577
      ],
      [
        -11.946515,
        -77.060633
      ],
      [
        -11.946493,
        -77.06055
      ],
      [
        -11.946706,
        -77.060527
      ],
      [
        -11.946824,
        -77.060577
      ]
    ],
    "lineIds": [
      "linea-b"
    ],
    "isTransfer": false
  },
  {
    "id": "las-vegas",
    "name": "Las Vegas",
    "lat": -11.954885,
    "lng": -77.059925,
    "polygon": [
      [
        -11.955091,
        -77.059919
      ],
      [
        -11.954718,
        -77.059948
      ],
      [
        -11.954711,
        -77.059882
      ],
      [
        -11.955081,
        -77.059888
      ],
      [
        -11.955091,
        -77.059919
      ]
    ],
    "lineIds": [
      "linea-b"
    ],
    "isTransfer": false
  },
  {
    "id": "universidad",
    "name": "Universidad",
    "lat": -11.962783,
    "lng": -77.062314,
    "polygon": [
      [
        -11.962731,
        -77.062396
      ],
      [
        -11.962718,
        -77.062312
      ],
      [
        -11.963227,
        -77.062209
      ],
      [
        -11.963251,
        -77.062257
      ],
      [
        -11.962731,
        -77.062396
      ]
    ],
    "lineIds": [
      "linea-b"
    ],
    "isTransfer": false
  },
  {
    "id": "naranjal",
    "name": "Naranjal",
    "lat": -11.98259,
    "lng": -77.058706,
    "polygon": [
      [
        -11.980507,
        -77.05936
      ],
      [
        -11.980412,
        -77.058872
      ],
      [
        -11.982732,
        -77.0584
      ],
      [
        -11.982758,
        -77.058851
      ],
      [
        -11.980507,
        -77.05936
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-b"
    ],
    "isTransfer": true
  },
  {
    "id": "izaguirre",
    "name": "Izaguirre",
    "lat": -11.989526,
    "lng": -77.056969,
    "polygon": [
      [
        -11.989769,
        -77.05707
      ],
      [
        -11.989307,
        -77.057023
      ],
      [
        -11.989313,
        -77.056968
      ],
      [
        -11.989753,
        -77.057007
      ],
      [
        -11.989769,
        -77.05707
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-b"
    ],
    "isTransfer": true
  },
  {
    "id": "pacifico",
    "name": "Pacífico",
    "lat": -11.99476,
    "lng": -77.056085,
    "polygon": [
      [
        -11.994432,
        -77.056298
      ],
      [
        -11.994406,
        -77.056241
      ],
      [
        -11.995259,
        -77.055721
      ],
      [
        -11.995293,
        -77.055776
      ],
      [
        -11.994432,
        -77.056298
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-b"
    ],
    "isTransfer": true
  },
  {
    "id": "independencia",
    "name": "Independencia",
    "lat": -11.998489,
    "lng": -77.055262,
    "polygon": [
      [
        -11.998188,
        -77.055338
      ],
      [
        -11.998178,
        -77.055208
      ],
      [
        -11.999289,
        -77.055075
      ],
      [
        -11.999312,
        -77.055192
      ],
      [
        -11.998188,
        -77.055338
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-b"
    ],
    "isTransfer": true
  },
  {
    "id": "los-jazmines",
    "name": "Los Jazmines",
    "lat": -12.00168,
    "lng": -77.054864,
    "polygon": [
      [
        -12.001786,
        -77.054852
      ],
      [
        -12.001731,
        -77.054787
      ],
      [
        -12.002274,
        -77.054705
      ],
      [
        -12.002278,
        -77.054775
      ],
      [
        -12.001786,
        -77.054852
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-b"
    ],
    "isTransfer": true
  },
  {
    "id": "tomas-valle",
    "name": "Tomás Valle",
    "lat": -12.006676,
    "lng": -77.05395,
    "polygon": [
      [
        -12.006597,
        -77.053994
      ],
      [
        -12.006584,
        -77.053928
      ],
      [
        -12.007046,
        -77.053838
      ],
      [
        -12.007057,
        -77.053895
      ],
      [
        -12.006597,
        -77.053994
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-b"
    ],
    "isTransfer": true
  },
  {
    "id": "el-milagro",
    "name": "El Milagro",
    "lat": -12.011229,
    "lng": -77.052935,
    "polygon": [
      [
        -12.011143,
        -77.053005
      ],
      [
        -12.011136,
        -77.052945
      ],
      [
        -12.011515,
        -77.05286
      ],
      [
        -12.011525,
        -77.052917
      ],
      [
        -12.011143,
        -77.053005
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-b"
    ],
    "isTransfer": true
  },
  {
    "id": "honorio-delgado",
    "name": "Honorio Delgado",
    "lat": -12.017861,
    "lng": -77.051436,
    "polygon": [
      [
        -12.017348,
        -77.051585
      ],
      [
        -12.01734,
        -77.051534
      ],
      [
        -12.017944,
        -77.051376
      ],
      [
        -12.017972,
        -77.051427
      ],
      [
        -12.017348,
        -77.051585
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-b"
    ],
    "isTransfer": true
  },
  {
    "id": "uni",
    "name": "UNI",
    "lat": -12.023357,
    "lng": -77.049769,
    "polygon": [
      [
        -12.023331,
        -77.049822
      ],
      [
        -12.023322,
        -77.049802
      ],
      [
        -12.023454,
        -77.049627
      ],
      [
        -12.023461,
        -77.04966
      ],
      [
        -12.023331,
        -77.049822
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-b"
    ],
    "isTransfer": true
  },
  {
    "id": "parque-del-trabajo",
    "name": "Parque del Trabajo",
    "lat": -12.029878,
    "lng": -77.044205,
    "polygon": [
      [
        -12.030156,
        -77.044259
      ],
      [
        -12.028996,
        -77.044353
      ],
      [
        -12.028987,
        -77.044214
      ],
      [
        -12.030125,
        -77.044137
      ],
      [
        -12.030156,
        -77.044259
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-b"
    ],
    "isTransfer": true
  },
  {
    "id": "caqueta",
    "name": "Caquetá",
    "lat": -12.036364,
    "lng": -77.04366,
    "polygon": [
      [
        -12.036512,
        -77.043678
      ],
      [
        -12.036132,
        -77.043712
      ],
      [
        -12.03613,
        -77.043638
      ],
      [
        -12.036504,
        -77.043609
      ],
      [
        -12.036512,
        -77.043678
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-b"
    ],
    "isTransfer": true
  },
  {
    "id": "ramon-castilla",
    "name": "Ramón Castilla",
    "lat": -12.043976,
    "lng": -77.041472,
    "polygon": [
      [
        -12.04388,
        -77.041686
      ],
      [
        -12.043839,
        -77.041666
      ],
      [
        -12.044057,
        -77.041289
      ],
      [
        -12.044107,
        -77.04132
      ],
      [
        -12.04388,
        -77.041686
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-c"
    ],
    "isTransfer": true
  },
  {
    "id": "2-de-mayo",
    "name": "2 de Mayo",
    "lat": -12.047405,
    "lng": -77.042681,
    "polygon": [
      [
        -12.047346,
        -77.042696
      ],
      [
        -12.047381,
        -77.042658
      ],
      [
        -12.047483,
        -77.042651
      ],
      [
        -12.04749,
        -77.042665
      ],
      [
        -12.047346,
        -77.042696
      ]
    ],
    "lineIds": [
      "linea-b"
    ],
    "isTransfer": false
  },
  {
    "id": "tacna",
    "name": "Tacna",
    "lat": -12.046525,
    "lng": -77.037216,
    "polygon": [
      [
        -12.046481,
        -77.037311
      ],
      [
        -12.046458,
        -77.037289
      ],
      [
        -12.046645,
        -77.036979
      ],
      [
        -12.04667,
        -77.036997
      ],
      [
        -12.046481,
        -77.037311
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-c"
    ],
    "isTransfer": true
  },
  {
    "id": "quilca",
    "name": "Quilca",
    "lat": -12.051502,
    "lng": -77.042307,
    "polygon": [
      [
        -12.05093,
        -77.04238
      ],
      [
        -12.05093,
        -77.042317
      ],
      [
        -12.052154,
        -77.042213
      ],
      [
        -12.0522,
        -77.042281
      ],
      [
        -12.05093,
        -77.04238
      ]
    ],
    "lineIds": [
      "linea-b"
    ],
    "isTransfer": false
  },
  {
    "id": "espana",
    "name": "España",
    "lat": -12.057767,
    "lng": -77.041733,
    "polygon": [
      [
        -12.058066,
        -77.041801
      ],
      [
        -12.057587,
        -77.041842
      ],
      [
        -12.057572,
        -77.041765
      ],
      [
        -12.058063,
        -77.041725
      ],
      [
        -12.058066,
        -77.041801
      ]
    ],
    "lineIds": [
      "linea-b"
    ],
    "isTransfer": false
  },
  {
    "id": "jiron-de-la-union",
    "name": "Jirón de la Unión",
    "lat": -12.048388,
    "lng": -77.034247,
    "polygon": [
      [
        -12.048291,
        -77.034407
      ],
      [
        -12.048268,
        -77.034393
      ],
      [
        -12.048498,
        -77.034032
      ],
      [
        -12.048513,
        -77.03405
      ],
      [
        -12.048291,
        -77.034407
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-c"
    ],
    "isTransfer": true
  },
  {
    "id": "colmena",
    "name": "Colmena",
    "lat": -12.052377,
    "lng": -77.032914,
    "polygon": [
      [
        -12.052595,
        -77.033004
      ],
      [
        -12.05259,
        -77.033054
      ],
      [
        -12.052086,
        -77.032707
      ],
      [
        -12.052117,
        -77.032663
      ],
      [
        -12.052595,
        -77.033004
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-c"
    ],
    "isTransfer": true
  },
  {
    "id": "central",
    "name": "Central",
    "lat": -12.057661,
    "lng": -77.035973,
    "polygon": [
      [
        -12.059151,
        -77.03611
      ],
      [
        -12.055898,
        -77.036432
      ],
      [
        -12.05594,
        -77.035884
      ],
      [
        -12.05914,
        -77.035498
      ],
      [
        -12.059151,
        -77.03611
      ]
    ],
    "lineIds": [
      "linea-a",
      "linea-b",
      "linea-c"
    ],
    "isTransfer": true
  },
  {
    "id": "estadio-nacional",
    "name": "Estadio Nacional",
    "lat": -12.068592,
    "lng": -77.032122,
    "polygon": [
      [
        -12.068262,
        -77.03229
      ],
      [
        -12.06821,
        -77.03222
      ],
      [
        -12.068955,
        -77.031917
      ],
      [
        -12.06897,
        -77.032
      ],
      [
        -12.068262,
        -77.03229
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "mexico",
    "name": "México",
    "lat": -12.076622,
    "lng": -77.028973,
    "polygon": [
      [
        -12.076357,
        -77.029136
      ],
      [
        -12.076338,
        -77.029057
      ],
      [
        -12.076793,
        -77.028851
      ],
      [
        -12.076785,
        -77.028942
      ],
      [
        -12.076357,
        -77.029136
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "canada",
    "name": "Canadá",
    "lat": -12.082242,
    "lng": -77.026665,
    "polygon": [
      [
        -12.08212,
        -77.026747
      ],
      [
        -12.082096,
        -77.02667
      ],
      [
        -12.082403,
        -77.026529
      ],
      [
        -12.08242,
        -77.026626
      ],
      [
        -12.08212,
        -77.026747
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "javier-prado",
    "name": "Javier Prado",
    "lat": -12.089966,
    "lng": -77.023191,
    "polygon": [
      [
        -12.088773,
        -77.024025
      ],
      [
        -12.088767,
        -77.02377
      ],
      [
        -12.090834,
        -77.022654
      ],
      [
        -12.09086,
        -77.02289
      ],
      [
        -12.088773,
        -77.024025
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "canaval-y-moreyra",
    "name": "Canaval y Moreyra",
    "lat": -12.096455,
    "lng": -77.024887,
    "polygon": [
      [
        -12.098211,
        -77.0256
      ],
      [
        -12.098108,
        -77.025805
      ],
      [
        -12.095494,
        -77.024553
      ],
      [
        -12.095586,
        -77.024337
      ],
      [
        -12.098211,
        -77.0256
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "aramburu",
    "name": "Aramburú",
    "lat": -12.10344,
    "lng": -77.027382,
    "polygon": [
      [
        -12.104002,
        -77.027473
      ],
      [
        -12.103161,
        -77.027426
      ],
      [
        -12.103184,
        -77.027325
      ],
      [
        -12.103901,
        -77.027343
      ],
      [
        -12.104002,
        -77.027473
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "domingo-orue",
    "name": "Domingo Orué",
    "lat": -12.108526,
    "lng": -77.026417,
    "polygon": [
      [
        -12.108585,
        -77.02645
      ],
      [
        -12.108338,
        -77.026492
      ],
      [
        -12.108336,
        -77.026401
      ],
      [
        -12.108568,
        -77.026373
      ],
      [
        -12.108585,
        -77.02645
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "angamos",
    "name": "Angamos",
    "lat": -12.113139,
    "lng": -77.025939,
    "polygon": [
      [
        -12.114881,
        -77.026099
      ],
      [
        -12.112201,
        -77.026092
      ],
      [
        -12.112187,
        -77.025898
      ],
      [
        -12.114874,
        -77.025974
      ],
      [
        -12.114881,
        -77.026099
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "ricardo-palma",
    "name": "Ricardo Palma",
    "lat": -12.118356,
    "lng": -77.026035,
    "polygon": [
      [
        -12.117899,
        -77.026198
      ],
      [
        -12.117892,
        -77.026043
      ],
      [
        -12.120393,
        -77.025371
      ],
      [
        -12.120487,
        -77.025536
      ],
      [
        -12.117899,
        -77.026198
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "benavides",
    "name": "Benavides",
    "lat": -12.12511,
    "lng": -77.024203,
    "polygon": [
      [
        -12.125291,
        -77.024207
      ],
      [
        -12.124966,
        -77.024306
      ],
      [
        -12.124991,
        -77.0242
      ],
      [
        -12.125295,
        -77.024114
      ],
      [
        -12.125291,
        -77.024207
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "28-de-julio",
    "name": "28 de Julio",
    "lat": -12.129396,
    "lng": -77.022829,
    "polygon": [
      [
        -12.129256,
        -77.022932
      ],
      [
        -12.129239,
        -77.02284
      ],
      [
        -12.129502,
        -77.022767
      ],
      [
        -12.129496,
        -77.022833
      ],
      [
        -12.129256,
        -77.022932
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "plaza-de-flores",
    "name": "Plaza de Flores",
    "lat": -12.136401,
    "lng": -77.018673,
    "polygon": [
      [
        -12.136256,
        -77.018806
      ],
      [
        -12.136224,
        -77.018734
      ],
      [
        -12.136514,
        -77.01859
      ],
      [
        -12.136559,
        -77.018648
      ],
      [
        -12.136256,
        -77.018806
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "balta",
    "name": "Balta",
    "lat": -12.140887,
    "lng": -77.017748,
    "polygon": [
      [
        -12.141406,
        -77.01783
      ],
      [
        -12.140587,
        -77.017799
      ],
      [
        -12.140587,
        -77.017708
      ],
      [
        -12.141462,
        -77.017748
      ],
      [
        -12.141406,
        -77.01783
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "bulevar",
    "name": "Bulevar",
    "lat": -12.148398,
    "lng": -77.020121,
    "polygon": [
      [
        -12.14869,
        -77.020164
      ],
      [
        -12.148315,
        -77.020143
      ],
      [
        -12.148324,
        -77.020087
      ],
      [
        -12.148658,
        -77.020109
      ],
      [
        -12.14869,
        -77.020164
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "estadio-union",
    "name": "Estadio Unión",
    "lat": -12.153355,
    "lng": -77.019642,
    "polygon": [
      [
        -12.153684,
        -77.019635
      ],
      [
        -12.153183,
        -77.019689
      ],
      [
        -12.153159,
        -77.019615
      ],
      [
        -12.153656,
        -77.019573
      ],
      [
        -12.153684,
        -77.019635
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "escuela-militar",
    "name": "Escuela Militar",
    "lat": -12.159453,
    "lng": -77.018905,
    "polygon": [
      [
        -12.159857,
        -77.018933
      ],
      [
        -12.159849,
        -77.019009
      ],
      [
        -12.159101,
        -77.018944
      ],
      [
        -12.15908,
        -77.018814
      ],
      [
        -12.159857,
        -77.018933
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "teran",
    "name": "Terán",
    "lat": -12.168793,
    "lng": -77.018591,
    "polygon": [
      [
        -12.168509,
        -77.01881
      ],
      [
        -12.16853,
        -77.018629
      ],
      [
        -12.169078,
        -77.018326
      ],
      [
        -12.169131,
        -77.01845
      ],
      [
        -12.168509,
        -77.01881
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "rosario-de-villa",
    "name": "Rosario de Villa",
    "lat": -12.172704,
    "lng": -77.015422,
    "polygon": [
      [
        -12.172488,
        -77.015684
      ],
      [
        -12.17245,
        -77.015564
      ],
      [
        -12.172934,
        -77.015116
      ],
      [
        -12.172982,
        -77.015226
      ],
      [
        -12.172488,
        -77.015684
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  },
  {
    "id": "matellini",
    "name": "Matellini",
    "lat": -12.17893,
    "lng": -77.009938,
    "polygon": [
      [
        -12.178609,
        -77.010365
      ],
      [
        -12.178498,
        -77.010158
      ],
      [
        -12.181014,
        -77.007916
      ],
      [
        -12.181159,
        -77.008165
      ],
      [
        -12.178609,
        -77.010365
      ]
    ],
    "lineIds": [
      "linea-c"
    ],
    "isTransfer": false
  }
]

export const lines: Line[] = [
  {
    "id": "linea-a",
    "name": "Línea A",
    "type": "regular",
    "stationIds": [
      "naranjal",
      "izaguirre",
      "pacifico",
      "independencia",
      "los-jazmines",
      "tomas-valle",
      "el-milagro",
      "honorio-delgado",
      "uni",
      "parque-del-trabajo",
      "caqueta",
      "ramon-castilla",
      "tacna",
      "jiron-de-la-union",
      "colmena",
      "central"
    ]
  },
  {
    "id": "linea-b",
    "name": "Línea B",
    "type": "regular",
    "stationIds": [
      "chimpu-ocllo",
      "los-incas",
      "andres-belaunde",
      "22-de-agosto",
      "las-vegas",
      "universidad",
      "naranjal",
      "izaguirre",
      "pacifico",
      "independencia",
      "los-jazmines",
      "tomas-valle",
      "el-milagro",
      "honorio-delgado",
      "uni",
      "parque-del-trabajo",
      "caqueta",
      "2-de-mayo",
      "quilca",
      "espana",
      "central"
    ]
  },
  {
    "id": "linea-c",
    "name": "Línea C",
    "type": "regular",
    "stationIds": [
      "ramon-castilla",
      "tacna",
      "jiron-de-la-union",
      "colmena",
      "central",
      "estadio-nacional",
      "mexico",
      "canada",
      "javier-prado",
      "canaval-y-moreyra",
      "aramburu",
      "domingo-orue",
      "angamos",
      "ricardo-palma",
      "benavides",
      "28-de-julio",
      "plaza-de-flores",
      "balta",
      "bulevar",
      "estadio-union",
      "escuela-militar",
      "teran",
      "rosario-de-villa",
      "matellini"
    ]
  }
]

export const segments: Segment[] = [
  {
    "from": "naranjal",
    "to": "izaguirre",
    "lineId": "linea-a",
    "distanceMeters": 2711,
    "durationSeconds": 344,
    "estimatedTimeMinutes": 6
  },
  {
    "from": "izaguirre",
    "to": "pacifico",
    "lineId": "linea-a",
    "distanceMeters": 764,
    "durationSeconds": 102,
    "estimatedTimeMinutes": 2
  },
  {
    "from": "pacifico",
    "to": "independencia",
    "lineId": "linea-a",
    "distanceMeters": 430,
    "durationSeconds": 69,
    "estimatedTimeMinutes": 1
  },
  {
    "from": "independencia",
    "to": "los-jazmines",
    "lineId": "linea-a",
    "distanceMeters": 357,
    "durationSeconds": 43,
    "estimatedTimeMinutes": 1
  },
  {
    "from": "los-jazmines",
    "to": "tomas-valle",
    "lineId": "linea-a",
    "distanceMeters": 566,
    "durationSeconds": 159,
    "estimatedTimeMinutes": 3
  },
  {
    "from": "tomas-valle",
    "to": "el-milagro",
    "lineId": "linea-a",
    "distanceMeters": 1432,
    "durationSeconds": 196,
    "estimatedTimeMinutes": 3
  },
  {
    "from": "el-milagro",
    "to": "honorio-delgado",
    "lineId": "linea-a",
    "distanceMeters": 1534,
    "durationSeconds": 330,
    "estimatedTimeMinutes": 6
  },
  {
    "from": "honorio-delgado",
    "to": "uni",
    "lineId": "linea-a",
    "distanceMeters": 2754,
    "durationSeconds": 490,
    "estimatedTimeMinutes": 8
  },
  {
    "from": "uni",
    "to": "parque-del-trabajo",
    "lineId": "linea-a",
    "distanceMeters": 2694,
    "durationSeconds": 513,
    "estimatedTimeMinutes": 9
  },
  {
    "from": "parque-del-trabajo",
    "to": "caqueta",
    "lineId": "linea-a",
    "distanceMeters": 1875,
    "durationSeconds": 377,
    "estimatedTimeMinutes": 6
  },
  {
    "from": "caqueta",
    "to": "ramon-castilla",
    "lineId": "linea-a",
    "distanceMeters": 1433,
    "durationSeconds": 298,
    "estimatedTimeMinutes": 5
  },
  {
    "from": "ramon-castilla",
    "to": "tacna",
    "lineId": "linea-a",
    "distanceMeters": 988,
    "durationSeconds": 323,
    "estimatedTimeMinutes": 5
  },
  {
    "from": "tacna",
    "to": "jiron-de-la-union",
    "lineId": "linea-a",
    "distanceMeters": 1934,
    "durationSeconds": 613,
    "estimatedTimeMinutes": 10
  },
  {
    "from": "jiron-de-la-union",
    "to": "colmena",
    "lineId": "linea-a",
    "distanceMeters": 2173,
    "durationSeconds": 725,
    "estimatedTimeMinutes": 12
  },
  {
    "from": "colmena",
    "to": "central",
    "lineId": "linea-a",
    "distanceMeters": 1284,
    "durationSeconds": 356,
    "estimatedTimeMinutes": 6
  },
  {
    "from": "chimpu-ocllo",
    "to": "los-incas",
    "lineId": "linea-b",
    "distanceMeters": 2408,
    "durationSeconds": 315,
    "estimatedTimeMinutes": 5
  },
  {
    "from": "los-incas",
    "to": "andres-belaunde",
    "lineId": "linea-b",
    "distanceMeters": 2386,
    "durationSeconds": 318,
    "estimatedTimeMinutes": 5
  },
  {
    "from": "andres-belaunde",
    "to": "22-de-agosto",
    "lineId": "linea-b",
    "distanceMeters": 1410,
    "durationSeconds": 203,
    "estimatedTimeMinutes": 3
  },
  {
    "from": "22-de-agosto",
    "to": "las-vegas",
    "lineId": "linea-b",
    "distanceMeters": 919,
    "durationSeconds": 125,
    "estimatedTimeMinutes": 2
  },
  {
    "from": "las-vegas",
    "to": "universidad",
    "lineId": "linea-b",
    "distanceMeters": 1537,
    "durationSeconds": 242,
    "estimatedTimeMinutes": 4
  },
  {
    "from": "universidad",
    "to": "naranjal",
    "lineId": "linea-b",
    "distanceMeters": 2700,
    "durationSeconds": 505,
    "estimatedTimeMinutes": 8
  },
  {
    "from": "caqueta",
    "to": "2-de-mayo",
    "lineId": "linea-b",
    "distanceMeters": 1596,
    "durationSeconds": 191,
    "estimatedTimeMinutes": 3
  },
  {
    "from": "2-de-mayo",
    "to": "quilca",
    "lineId": "linea-b",
    "distanceMeters": 458,
    "durationSeconds": 67,
    "estimatedTimeMinutes": 1
  },
  {
    "from": "quilca",
    "to": "espana",
    "lineId": "linea-b",
    "distanceMeters": 1177,
    "durationSeconds": 322,
    "estimatedTimeMinutes": 5
  },
  {
    "from": "espana",
    "to": "central",
    "lineId": "linea-b",
    "distanceMeters": 943,
    "durationSeconds": 318,
    "estimatedTimeMinutes": 5
  },
  {
    "from": "central",
    "to": "estadio-nacional",
    "lineId": "linea-c",
    "distanceMeters": 1311,
    "durationSeconds": 88,
    "estimatedTimeMinutes": 1
  },
  {
    "from": "estadio-nacional",
    "to": "mexico",
    "lineId": "linea-c",
    "distanceMeters": 957,
    "durationSeconds": 57,
    "estimatedTimeMinutes": 1
  },
  {
    "from": "mexico",
    "to": "canada",
    "lineId": "linea-c",
    "distanceMeters": 673,
    "durationSeconds": 48,
    "estimatedTimeMinutes": 1
  },
  {
    "from": "canada",
    "to": "javier-prado",
    "lineId": "linea-c",
    "distanceMeters": 942,
    "durationSeconds": 120,
    "estimatedTimeMinutes": 2
  },
  {
    "from": "javier-prado",
    "to": "canaval-y-moreyra",
    "lineId": "linea-c",
    "distanceMeters": 761,
    "durationSeconds": 68,
    "estimatedTimeMinutes": 1
  },
  {
    "from": "canaval-y-moreyra",
    "to": "aramburu",
    "lineId": "linea-c",
    "distanceMeters": 834,
    "durationSeconds": 52,
    "estimatedTimeMinutes": 1
  },
  {
    "from": "aramburu",
    "to": "domingo-orue",
    "lineId": "linea-c",
    "distanceMeters": 1833,
    "durationSeconds": 318,
    "estimatedTimeMinutes": 5
  },
  {
    "from": "domingo-orue",
    "to": "angamos",
    "lineId": "linea-c",
    "distanceMeters": 2627,
    "durationSeconds": 392,
    "estimatedTimeMinutes": 7
  },
  {
    "from": "angamos",
    "to": "ricardo-palma",
    "lineId": "linea-c",
    "distanceMeters": 2999,
    "durationSeconds": 330,
    "estimatedTimeMinutes": 6
  },
  {
    "from": "ricardo-palma",
    "to": "benavides",
    "lineId": "linea-c",
    "distanceMeters": 779,
    "durationSeconds": 47,
    "estimatedTimeMinutes": 1
  },
  {
    "from": "benavides",
    "to": "28-de-julio",
    "lineId": "linea-c",
    "distanceMeters": 500,
    "durationSeconds": 28,
    "estimatedTimeMinutes": 0
  },
  {
    "from": "28-de-julio",
    "to": "plaza-de-flores",
    "lineId": "linea-c",
    "distanceMeters": 918,
    "durationSeconds": 72,
    "estimatedTimeMinutes": 1
  },
  {
    "from": "plaza-de-flores",
    "to": "balta",
    "lineId": "linea-c",
    "distanceMeters": 1044,
    "durationSeconds": 314,
    "estimatedTimeMinutes": 5
  },
  {
    "from": "balta",
    "to": "bulevar",
    "lineId": "linea-c",
    "distanceMeters": 3088,
    "durationSeconds": 747,
    "estimatedTimeMinutes": 12
  },
  {
    "from": "bulevar",
    "to": "estadio-union",
    "lineId": "linea-c",
    "distanceMeters": 2033,
    "durationSeconds": 503,
    "estimatedTimeMinutes": 8
  },
  {
    "from": "estadio-union",
    "to": "escuela-militar",
    "lineId": "linea-c",
    "distanceMeters": 1303,
    "durationSeconds": 190,
    "estimatedTimeMinutes": 3
  },
  {
    "from": "escuela-militar",
    "to": "teran",
    "lineId": "linea-c",
    "distanceMeters": 2409,
    "durationSeconds": 323,
    "estimatedTimeMinutes": 5
  },
  {
    "from": "teran",
    "to": "rosario-de-villa",
    "lineId": "linea-c",
    "distanceMeters": 557,
    "durationSeconds": 52,
    "estimatedTimeMinutes": 1
  },
  {
    "from": "rosario-de-villa",
    "to": "matellini",
    "lineId": "linea-c",
    "distanceMeters": 1612,
    "durationSeconds": 423,
    "estimatedTimeMinutes": 7
  }
]

export const stationsById = Object.fromEntries(stations.map(s => [s.id, s]))
export const linesById = Object.fromEntries(lines.map(l => [l.id, l]))