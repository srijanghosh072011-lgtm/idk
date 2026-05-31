/* ============================================================================
 * squads.js  —  Real(ish) 2025-26 Premier League squads
 * ----------------------------------------------------------------------------
 * Record format: [name, position, age, nationality, overall, potential]
 * Positions: GK RB CB LB CDM CM RM LM CAM RW LW ST
 * Ratings/values are approximations tuned for gameplay, not official numbers.
 * Reflects known summer-2025 transfers where available; treat as a season-start
 * snapshot. Easy to edit — just change the numbers.
 * ==========================================================================*/
(function (root) {
  root.Gaffer = root.Gaffer || {};
  var G = root.Gaffer;
  G.DATA = G.DATA || {};

  G.DATA.squads = {
    liverpool: [
      ['Alisson', 'GK', 32, 'BRA', 89, 89], ['Giorgi Mamardashvili', 'GK', 24, 'GEO', 82, 86],
      ['Jeremie Frimpong', 'RB', 24, 'NED', 82, 85], ['Conor Bradley', 'RB', 22, 'NIR', 77, 84],
      ['Virgil van Dijk', 'CB', 34, 'NED', 89, 89], ['Ibrahima Konaté', 'CB', 26, 'FRA', 85, 87],
      ['Milos Kerkez', 'LB', 21, 'HUN', 80, 86], ['Andrew Robertson', 'LB', 31, 'SCO', 83, 83],
      ['Ryan Gravenberch', 'CDM', 23, 'NED', 85, 89], ['Alexis Mac Allister', 'CM', 26, 'ARG', 86, 88],
      ['Dominik Szoboszlai', 'CM', 24, 'HUN', 84, 87], ['Curtis Jones', 'CM', 24, 'ENG', 79, 83],
      ['Wataru Endo', 'CM', 32, 'JPN', 79, 79], ['Mohamed Salah', 'RW', 33, 'EGY', 90, 90],
      ['Florian Wirtz', 'CAM', 22, 'GER', 87, 92], ['Cody Gakpo', 'LW', 26, 'NED', 84, 87],
      ['Hugo Ekitike', 'ST', 23, 'FRA', 82, 88], ['Darwin Nunez', 'ST', 26, 'URU', 81, 84]
    ],
    mancity: [
      ['Ederson', 'GK', 32, 'BRA', 87, 87], ['Stefan Ortega', 'GK', 32, 'GER', 79, 79],
      ['Matheus Nunes', 'RB', 27, 'POR', 80, 82], ['Rico Lewis', 'RB', 20, 'ENG', 78, 86],
      ['Ruben Dias', 'CB', 28, 'POR', 88, 89], ['Josko Gvardiol', 'CB', 23, 'CRO', 85, 89],
      ['Nathan Ake', 'CB', 30, 'NED', 82, 82], ['Rayan Ait-Nouri', 'LB', 24, 'ALG', 81, 85],
      ['Rodri', 'CDM', 29, 'ESP', 91, 91], ['Bernardo Silva', 'CM', 31, 'POR', 86, 86],
      ['Mateo Kovacic', 'CM', 31, 'CRO', 83, 83], ['Tijjani Reijnders', 'CM', 27, 'NED', 84, 86],
      ['Phil Foden', 'CAM', 25, 'ENG', 87, 90], ['Savinho', 'RW', 21, 'BRA', 81, 88],
      ['Jeremy Doku', 'LW', 23, 'BEL', 83, 88], ['Rayan Cherki', 'CAM', 22, 'FRA', 82, 88],
      ['Erling Haaland', 'ST', 25, 'NOR', 91, 93], ['Omar Marmoush', 'ST', 26, 'EGY', 83, 86]
    ],
    arsenal: [
      ['David Raya', 'GK', 30, 'ESP', 86, 86], ['Kepa Arrizabalaga', 'GK', 31, 'ESP', 79, 79],
      ['Jurrien Timber', 'RB', 24, 'NED', 83, 87], ['William Saliba', 'CB', 24, 'FRA', 87, 91],
      ['Gabriel Magalhaes', 'CB', 28, 'BRA', 87, 88], ['Riccardo Calafiori', 'LB', 23, 'ITA', 82, 87],
      ['Myles Lewis-Skelly', 'LB', 19, 'ENG', 78, 88], ['Declan Rice', 'CDM', 26, 'ENG', 88, 90],
      ['Martin Zubimendi', 'CM', 26, 'ESP', 85, 88], ['Martin Odegaard', 'CM', 27, 'NOR', 88, 90],
      ['Mikel Merino', 'CM', 29, 'ESP', 82, 83], ['Ethan Nwaneri', 'CAM', 18, 'ENG', 75, 89],
      ['Bukayo Saka', 'RW', 24, 'ENG', 88, 92], ['Gabriel Martinelli', 'LW', 24, 'BRA', 83, 87],
      ['Leandro Trossard', 'LW', 30, 'BEL', 82, 82], ['Viktor Gyokeres', 'ST', 27, 'SWE', 86, 88],
      ['Kai Havertz', 'ST', 26, 'GER', 84, 86]
    ],
    chelsea: [
      ['Robert Sanchez', 'GK', 28, 'ESP', 81, 83], ['Filip Jorgensen', 'GK', 23, 'DEN', 78, 84],
      ['Reece James', 'RB', 25, 'ENG', 84, 87], ['Malo Gusto', 'RB', 22, 'FRA', 80, 86],
      ['Levi Colwill', 'CB', 22, 'ENG', 82, 88], ['Wesley Fofana', 'CB', 24, 'FRA', 82, 87],
      ['Marc Cucurella', 'LB', 27, 'ESP', 83, 84], ['Moises Caicedo', 'CDM', 24, 'ECU', 86, 90],
      ['Enzo Fernandez', 'CM', 24, 'ARG', 85, 89], ['Romeo Lavia', 'CM', 21, 'BEL', 79, 86],
      ['Cole Palmer', 'CAM', 23, 'ENG', 88, 92], ['Pedro Neto', 'RW', 25, 'POR', 82, 85],
      ['Estevao Willian', 'RW', 18, 'BRA', 79, 91], ['Jamie Gittens', 'LW', 21, 'ENG', 79, 87],
      ['Nicolas Jackson', 'ST', 24, 'SEN', 81, 86], ['Liam Delap', 'ST', 22, 'ENG', 80, 87],
      ['Joao Pedro', 'ST', 23, 'BRA', 82, 87]
    ],
    manutd: [
      ['Andre Onana', 'GK', 29, 'CMR', 82, 84], ['Altay Bayindir', 'GK', 27, 'TUR', 76, 78],
      ['Noussair Mazraoui', 'RB', 27, 'MAR', 81, 83], ['Matthijs de Ligt', 'CB', 26, 'NED', 84, 86],
      ['Lisandro Martinez', 'CB', 27, 'ARG', 84, 86], ['Leny Yoro', 'CB', 19, 'FRA', 79, 90],
      ['Patrick Dorgu', 'LB', 21, 'DEN', 77, 85], ['Bruno Fernandes', 'CM', 31, 'POR', 87, 87],
      ['Casemiro', 'CDM', 33, 'BRA', 81, 81], ['Manuel Ugarte', 'CM', 24, 'URU', 80, 84],
      ['Kobbie Mainoo', 'CM', 20, 'ENG', 80, 89], ['Amad Diallo', 'RW', 23, 'CIV', 81, 87],
      ['Bryan Mbeumo', 'RW', 26, 'CMR', 84, 86], ['Matheus Cunha', 'CAM', 26, 'BRA', 84, 86],
      ['Mason Mount', 'CAM', 26, 'ENG', 80, 84], ['Rasmus Hojlund', 'ST', 22, 'DEN', 80, 87],
      ['Benjamin Sesko', 'ST', 22, 'SVN', 82, 90]
    ],
    tottenham: [
      ['Guglielmo Vicario', 'GK', 29, 'ITA', 84, 86], ['Antonin Kinsky', 'GK', 22, 'CZE', 77, 84],
      ['Pedro Porro', 'RB', 26, 'ESP', 83, 85], ['Cristian Romero', 'CB', 27, 'ARG', 86, 88],
      ['Micky van de Ven', 'CB', 24, 'NED', 84, 88], ['Kevin Danso', 'CB', 27, 'AUT', 79, 81],
      ['Destiny Udogie', 'LB', 23, 'ITA', 81, 86], ['Rodrigo Bentancur', 'CDM', 28, 'URU', 81, 82],
      ['Pape Matar Sarr', 'CM', 23, 'SEN', 80, 86], ['James Maddison', 'CM', 29, 'ENG', 84, 85],
      ['Joao Palhinha', 'CDM', 30, 'POR', 83, 84], ['Brennan Johnson', 'RW', 24, 'WAL', 80, 84],
      ['Mohammed Kudus', 'RW', 25, 'GHA', 84, 87], ['Dejan Kulusevski', 'CAM', 25, 'SWE', 84, 87],
      ['Wilson Odobert', 'LW', 20, 'FRA', 76, 85], ['Dominic Solanke', 'ST', 28, 'ENG', 82, 83],
      ['Richarlison', 'ST', 28, 'BRA', 80, 81]
    ],
    newcastle: [
      ['Nick Pope', 'GK', 33, 'ENG', 81, 81], ['Martin Dubravka', 'GK', 36, 'SVK', 76, 76],
      ['Tino Livramento', 'RB', 23, 'ENG', 80, 86], ['Kieran Trippier', 'RB', 35, 'ENG', 78, 78],
      ['Sven Botman', 'CB', 25, 'NED', 82, 86], ['Fabian Schar', 'CB', 33, 'SUI', 82, 82],
      ['Dan Burn', 'CB', 33, 'ENG', 79, 79], ['Lewis Hall', 'LB', 21, 'ENG', 78, 85],
      ['Bruno Guimaraes', 'CDM', 28, 'BRA', 86, 88], ['Sandro Tonali', 'CM', 25, 'ITA', 84, 88],
      ['Joelinton', 'CM', 29, 'BRA', 83, 84], ['Lewis Miley', 'CM', 19, 'ENG', 73, 85],
      ['Anthony Gordon', 'LW', 24, 'ENG', 83, 87], ['Jacob Murphy', 'RW', 30, 'ENG', 78, 78],
      ['Harvey Barnes', 'LW', 27, 'ENG', 79, 81], ['Alexander Isak', 'ST', 26, 'SWE', 87, 90],
      ['Yoane Wissa', 'ST', 29, 'COD', 82, 83], ['William Osula', 'ST', 22, 'DEN', 73, 82]
    ],
    astonvilla: [
      ['Emiliano Martinez', 'GK', 33, 'ARG', 85, 85], ['Marco Bizot', 'GK', 34, 'NED', 75, 75],
      ['Matty Cash', 'RB', 28, 'POL', 79, 80], ['Ezri Konsa', 'CB', 28, 'ENG', 82, 84],
      ['Pau Torres', 'CB', 28, 'ESP', 83, 84], ['Tyrone Mings', 'CB', 32, 'ENG', 79, 79],
      ['Lucas Digne', 'LB', 32, 'FRA', 79, 79], ['Boubacar Kamara', 'CDM', 26, 'FRA', 83, 85],
      ['Youri Tielemans', 'CM', 28, 'BEL', 83, 84], ['John McGinn', 'CM', 31, 'SCO', 80, 80],
      ['Amadou Onana', 'CM', 24, 'BEL', 82, 86], ['Morgan Rogers', 'CAM', 23, 'ENG', 81, 88],
      ['Leon Bailey', 'RW', 28, 'JAM', 80, 81], ['Emiliano Buendia', 'LW', 28, 'ARG', 78, 80],
      ['Jacob Ramsey', 'CM', 24, 'ENG', 78, 84], ['Ollie Watkins', 'ST', 29, 'ENG', 84, 85],
      ['Donyell Malen', 'ST', 26, 'NED', 80, 83]
    ],
    brighton: [
      ['Bart Verbruggen', 'GK', 23, 'NED', 80, 86], ['Jason Steele', 'GK', 35, 'ENG', 72, 72],
      ['Tariq Lamptey', 'RB', 25, 'GHA', 76, 78], ['Lewis Dunk', 'CB', 33, 'ENG', 80, 80],
      ['Jan Paul van Hecke', 'CB', 25, 'NED', 80, 85], ['Igor Julio', 'CB', 27, 'BRA', 79, 81],
      ['Pervis Estupinan', 'LB', 27, 'ECU', 81, 83], ['Carlos Baleba', 'CDM', 21, 'CMR', 82, 90],
      ['Yasin Ayari', 'CM', 22, 'SWE', 76, 84], ['Mats Wieffer', 'CM', 26, 'NED', 78, 81],
      ['Georginio Rutter', 'CAM', 23, 'FRA', 80, 86], ['Kaoru Mitoma', 'LW', 28, 'JPN', 83, 85],
      ['Yankuba Minteh', 'RW', 21, 'GAM', 79, 87], ['Simon Adingra', 'RW', 23, 'CIV', 78, 85],
      ['Evan Ferguson', 'ST', 21, 'IRL', 77, 87], ['Danny Welbeck', 'ST', 34, 'ENG', 76, 76],
      ['Joao Pedro Brighton', 'ST', 23, 'BRA', 79, 84]
    ],
    forest: [
      ['Matz Sels', 'GK', 33, 'BEL', 80, 80], ['Carlos Miguel', 'GK', 27, 'BRA', 74, 78],
      ['Ola Aina', 'RB', 28, 'NGA', 79, 80], ['Murillo', 'CB', 23, 'BRA', 83, 88],
      ['Nikola Milenkovic', 'CB', 28, 'SRB', 82, 83], ['Morato', 'CB', 24, 'BRA', 75, 81],
      ['Neco Williams', 'LB', 24, 'WAL', 78, 81], ['Ibrahim Sangare', 'CDM', 28, 'CIV', 79, 81],
      ['Elliot Anderson', 'CM', 23, 'ENG', 80, 86], ['Morgan Gibbs-White', 'CAM', 25, 'ENG', 83, 86],
      ['Callum Hudson-Odoi', 'LW', 25, 'ENG', 79, 81], ['Dan Ndoye', 'RW', 24, 'SUI', 79, 84],
      ['Ramon Sosa', 'LW', 24, 'PAR', 75, 81], ['Chris Wood', 'ST', 34, 'NZL', 80, 80],
      ['Taiwo Awoniyi', 'ST', 28, 'NGA', 77, 80], ['Igor Jesus', 'ST', 24, 'BRA', 75, 80]
    ],
    westham: [
      ['Alphonse Areola', 'GK', 32, 'FRA', 80, 80], ['Mads Hermansen', 'GK', 25, 'DEN', 78, 83],
      ['Vladimir Coufal', 'RB', 33, 'CZE', 76, 76], ['Max Kilman', 'CB', 28, 'ENG', 80, 82],
      ['Jean-Clair Todibo', 'CB', 25, 'FRA', 81, 85], ['Konstantinos Mavropanos', 'CB', 27, 'GRE', 79, 81],
      ['Emerson Palmieri', 'LB', 31, 'ITA', 77, 77], ['Edson Alvarez', 'CDM', 27, 'MEX', 81, 83],
      ['Tomas Soucek', 'CM', 30, 'CZE', 79, 79], ['Lucas Paqueta', 'CAM', 28, 'BRA', 82, 84],
      ['James Ward-Prowse', 'CM', 30, 'ENG', 79, 79], ['Jarrod Bowen', 'RW', 28, 'ENG', 83, 84],
      ['Crysencio Summerville', 'LW', 23, 'NED', 79, 85], ['Luis Guilherme', 'RW', 19, 'BRA', 72, 84],
      ['Niclas Fullkrug', 'ST', 32, 'GER', 79, 79], ['Callum Wilson', 'ST', 33, 'ENG', 75, 75]
    ],
    everton: [
      ['Jordan Pickford', 'GK', 31, 'ENG', 83, 83], ['Mark Travers', 'GK', 26, 'IRL', 73, 76],
      ['Nathan Patterson', 'RB', 23, 'SCO', 75, 80], ['Jarrad Branthwaite', 'CB', 23, 'ENG', 82, 88],
      ['James Tarkowski', 'CB', 32, 'ENG', 80, 80], ['Michael Keane', 'CB', 32, 'ENG', 76, 76],
      ['Vitalii Mykolenko', 'LB', 26, 'UKR', 78, 80], ['Idrissa Gana Gueye', 'CDM', 35, 'SEN', 77, 77],
      ['James Garner', 'CM', 24, 'ENG', 77, 82], ['Tim Iroegbunam', 'CM', 22, 'ENG', 73, 81],
      ['Iliman Ndiaye', 'CAM', 25, 'SEN', 80, 84], ['Dwight McNeil', 'LW', 25, 'ENG', 79, 81],
      ['Jack Harrison', 'RW', 28, 'ENG', 76, 76], ['Jesper Lindstrom', 'RW', 25, 'DEN', 77, 82],
      ['Beto', 'ST', 27, 'GNB', 76, 79], ['Thierno Barry', 'ST', 22, 'FRA', 76, 84]
    ],
    palace: [
      ['Dean Henderson', 'GK', 28, 'ENG', 80, 81], ['Walter Benitez', 'GK', 32, 'ARG', 74, 74],
      ['Daniel Munoz', 'RB', 29, 'COL', 80, 81], ['Marc Guehi', 'CB', 25, 'ENG', 84, 87],
      ['Maxence Lacroix', 'CB', 25, 'FRA', 80, 84], ['Chris Richards', 'CB', 25, 'USA', 78, 82],
      ['Tyrick Mitchell', 'LB', 26, 'ENG', 78, 80], ['Adam Wharton', 'CDM', 21, 'ENG', 80, 88],
      ['Will Hughes', 'CM', 30, 'ENG', 75, 75], ['Daichi Kamada', 'CM', 29, 'JPN', 79, 80],
      ['Ismaila Sarr', 'RW', 27, 'SEN', 80, 83], ['Eberechi Eze', 'CAM', 27, 'ENG', 84, 87],
      ['Jesurun Rak-Sakyi', 'RW', 22, 'ENG', 73, 82], ['Jean-Philippe Mateta', 'ST', 28, 'FRA', 82, 84],
      ['Eddie Nketiah', 'ST', 26, 'ENG', 77, 80], ['Matheus Franca', 'CAM', 21, 'BRA', 74, 83]
    ],
    bournemouth: [
      ['Djordje Petrovic', 'GK', 25, 'SRB', 79, 84], ['Will Dennis', 'GK', 25, 'ENG', 70, 73],
      ['Adam Smith', 'RB', 34, 'ENG', 73, 73], ['Marcos Senesi', 'CB', 28, 'ARG', 80, 82],
      ['Bafode Diakite', 'CB', 24, 'FRA', 79, 84], ['James Hill', 'CB', 23, 'ENG', 73, 79],
      ['Adrien Truffert', 'LB', 23, 'FRA', 78, 83], ['Tyler Adams', 'CDM', 26, 'USA', 79, 82],
      ['Lewis Cook', 'CM', 28, 'ENG', 78, 79], ['Ryan Christie', 'CM', 30, 'SCO', 76, 76],
      ['Antoine Semenyo', 'RW', 25, 'GHA', 82, 85], ['Marcus Tavernier', 'LW', 26, 'ENG', 77, 80],
      ['Justin Kluivert', 'RW', 26, 'NED', 79, 81], ['David Brooks', 'CAM', 28, 'WAL', 75, 76],
      ['Evanilson', 'ST', 26, 'BRA', 81, 84], ['Enes Unal', 'ST', 28, 'TUR', 75, 76]
    ],
    brentford: [
      ['Caoimhin Kelleher', 'GK', 27, 'IRL', 80, 83], ['Hakon Valdimarsson', 'GK', 24, 'ISL', 73, 79],
      ['Aaron Hickey', 'RB', 23, 'SCO', 76, 82], ['Nathan Collins', 'CB', 24, 'IRL', 80, 84],
      ['Ethan Pinnock', 'CB', 32, 'JAM', 78, 78], ['Kristoffer Ajer', 'CB', 27, 'NOR', 77, 79],
      ['Rico Henry', 'LB', 28, 'ENG', 78, 80], ['Yegor Yarmoliuk', 'CDM', 21, 'UKR', 74, 83],
      ['Vitaly Janelt', 'CM', 27, 'GER', 77, 78], ['Mathias Jensen', 'CM', 29, 'DEN', 77, 77],
      ['Kevin Schade', 'RW', 24, 'GER', 78, 84], ['Keane Lewis-Potter', 'LW', 24, 'ENG', 76, 81],
      ['Fabio Carvalho', 'CAM', 23, 'POR', 75, 82], ['Igor Thiago', 'ST', 24, 'BRA', 77, 84],
      ['Gustavo Nunes', 'LW', 20, 'BRA', 72, 83], ['Dango Ouattara', 'RW', 23, 'BFA', 77, 83]
    ],
    fulham: [
      ['Bernd Leno', 'GK', 33, 'GER', 81, 81], ['Benjamin Lecomte', 'GK', 34, 'FRA', 73, 73],
      ['Kenny Tete', 'RB', 29, 'NED', 77, 77], ['Calvin Bassey', 'CB', 25, 'NGA', 80, 84],
      ['Joachim Andersen', 'CB', 29, 'DEN', 80, 81], ['Issa Diop', 'CB', 28, 'FRA', 76, 76],
      ['Antonee Robinson', 'LB', 28, 'USA', 81, 83], ['Sander Berge', 'CDM', 27, 'NOR', 78, 80],
      ['Sasa Lukic', 'CM', 29, 'SRB', 77, 77], ['Tom Cairney', 'CM', 34, 'SCO', 74, 74],
      ['Harry Wilson', 'RW', 28, 'WAL', 77, 77], ['Alex Iwobi', 'LW', 29, 'NGA', 80, 81],
      ['Emile Smith Rowe', 'CAM', 25, 'ENG', 78, 83], ['Adama Traore', 'RW', 29, 'ESP', 76, 76],
      ['Raul Jimenez', 'ST', 34, 'MEX', 77, 77], ['Rodrigo Muniz', 'ST', 24, 'BRA', 78, 83]
    ],
    wolves: [
      ['Jose Sa', 'GK', 32, 'POR', 79, 79], ['Sam Johnstone', 'GK', 32, 'ENG', 75, 75],
      ['Nelson Semedo', 'RB', 31, 'POR', 77, 77], ['Toti Gomes', 'CB', 26, 'POR', 78, 81],
      ['Yerson Mosquera', 'CB', 24, 'COL', 75, 80], ['Santiago Bueno', 'CB', 26, 'URU', 76, 79],
      ['Hugo Bueno', 'LB', 22, 'ESP', 74, 81], ['Joao Gomes', 'CDM', 24, 'BRA', 81, 85],
      ['Andre', 'CM', 24, 'BRA', 80, 85], ['Mario Lemina', 'CM', 31, 'GAB', 78, 78],
      ['Jean-Ricner Bellegarde', 'CAM', 27, 'FRA', 77, 79], ['Hwang Hee-chan', 'RW', 29, 'KOR', 78, 80],
      ['Rodrigo Gomes', 'LW', 22, 'POR', 74, 81], ['Pablo Sarabia', 'RW', 33, 'ESP', 75, 75],
      ['Jorgen Strand Larsen', 'ST', 25, 'NOR', 79, 83], ['Fer Lopez', 'CAM', 21, 'ESP', 73, 83]
    ],
    leeds: [
      ['Illan Meslier', 'GK', 25, 'FRA', 77, 81], ['Lucas Perri', 'GK', 27, 'BRA', 77, 81],
      ['Jayden Bogle', 'RB', 25, 'ENG', 75, 78], ['Joe Rodon', 'CB', 28, 'WAL', 77, 79],
      ['Pascal Struijk', 'CB', 26, 'NED', 77, 80], ['Gabriel Gudmundsson', 'LB', 26, 'SWE', 75, 79],
      ['Junior Firpo', 'LB', 29, 'DOM', 74, 74], ['Ethan Ampadu', 'CDM', 25, 'WAL', 78, 81],
      ['Ao Tanaka', 'CM', 27, 'JPN', 76, 80], ['Sean Longstaff', 'CM', 27, 'ENG', 75, 76],
      ['Daniel James', 'RW', 27, 'WAL', 76, 77], ['Wilfried Gnonto', 'LW', 21, 'ITA', 77, 84],
      ['Brenden Aaronson', 'CAM', 24, 'USA', 75, 79], ['Largie Ramazani', 'RW', 24, 'BEL', 74, 79],
      ['Joel Piroe', 'ST', 25, 'NED', 76, 80], ['Lukas Nmecha', 'ST', 26, 'GER', 74, 78]
    ],
    burnley: [
      ['Max Weiss', 'GK', 21, 'GER', 72, 81], ['Vaclav Hladky', 'GK', 34, 'CZE', 72, 72],
      ['Connor Roberts', 'RB', 30, 'WAL', 73, 73], ['Maxime Esteve', 'CB', 23, 'FRA', 76, 82],
      ['Hjalmar Ekdal', 'CB', 26, 'SWE', 73, 76], ['Joe Worrall', 'CB', 28, 'ENG', 74, 75],
      ['Quilindschy Hartman', 'LB', 23, 'NED', 75, 81], ['Josh Cullen', 'CDM', 29, 'IRL', 75, 76],
      ['Josh Brownhill', 'CM', 29, 'ENG', 75, 76], ['Hannibal Mejbri', 'CM', 22, 'TUN', 74, 81],
      ['Jaidon Anthony', 'RW', 25, 'ENG', 73, 77], ['Jacob Bruun Larsen', 'LW', 27, 'DEN', 73, 75],
      ['Loum Tchaouna', 'RW', 21, 'FRA', 73, 80], ['Lyle Foster', 'ST', 25, 'RSA', 74, 79],
      ['Zian Flemming', 'ST', 27, 'NED', 74, 77], ['Marcus Edwards', 'CAM', 26, 'ENG', 74, 77]
    ],
    sunderland: [
      ['Anthony Patterson', 'GK', 25, 'ENG', 75, 80], ['Robin Roefs', 'GK', 22, 'NED', 72, 80],
      ['Trai Hume', 'RB', 23, 'NIR', 75, 80], ['Dan Ballard', 'CB', 25, 'NIR', 75, 79],
      ['Omar Alderete', 'CB', 28, 'PAR', 74, 76], ['Nordi Mukiele', 'CB', 27, 'FRA', 76, 79],
      ['Reinildo Mandava', 'LB', 31, 'MOZ', 75, 75], ['Noah Sadiki', 'CDM', 20, 'BEL', 74, 83],
      ['Granit Xhaka', 'CM', 32, 'SUI', 81, 81], ['Habib Diarra', 'CM', 21, 'SEN', 76, 84],
      ['Enzo Le Fee', 'CAM', 25, 'FRA', 77, 81], ['Chemsdine Talbi', 'RW', 20, 'BEL', 73, 81],
      ['Romaine Mundle', 'LW', 22, 'ENG', 73, 79], ['Bertrand Traore', 'RW', 30, 'BFA', 74, 74],
      ['Wilson Isidor', 'ST', 25, 'FRA', 75, 79], ['Eliezer Mayenda', 'ST', 20, 'ESP', 73, 81]
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
