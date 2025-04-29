import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Interface for test data generation parameters
 */
interface TestDataParams {
  numCustomers: number; // Maximum 1000
  minDogsPerCustomer: number;
  maxDogsPerCustomer: number;
  minAppointmentsPerDay: number;
  maxAppointmentsPerDay: number;
  monthRange: number;
}

/**
 * Generate test data for the application
 * Creates customers with dogs and randomized appointments
 * Some appointments will have multiple dogs and some dogs will have multiple services
 * 
 * The number of customers is limited to a maximum of 1000
 */
export const generateTestData = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
  // Get configuration parameters from query parameters with defaults
  const params: TestDataParams = {
    numCustomers: parseInt(req.query.numCustomers as string) || 20,
    minDogsPerCustomer: parseInt(req.query.minDogsPerCustomer as string) || 0,
    maxDogsPerCustomer: parseInt(req.query.maxDogsPerCustomer as string) || 3,
    minAppointmentsPerDay: parseInt(req.query.minAppointmentsPerDay as string) || 4,
    maxAppointmentsPerDay: parseInt(req.query.maxAppointmentsPerDay as string) || 5,
    monthRange: req.query.monthRange !== undefined ? parseInt(req.query.monthRange as string) : 1
  };
  
  // Validate parameters
  if (params.numCustomers < 1) {
    return res.status(400).json({
      success: false,
      message: 'Number of customers must be at least 1'
    });
  }
  
  // Limit number of customers to 1000 (the size of our customer names array)
  if (params.numCustomers > 1000) {
    params.numCustomers = 1000;
  }
  
  if (params.minDogsPerCustomer < 0 || params.maxDogsPerCustomer < params.minDogsPerCustomer) {
    return res.status(400).json({
      success: false,
      message: 'Invalid dog count range. Min must be >= 0 and max must be >= min'
    });
  }
  
  if (params.minAppointmentsPerDay < 0 || params.maxAppointmentsPerDay < params.minAppointmentsPerDay) {
    return res.status(400).json({
      success: false,
      message: 'Invalid appointments per day range. Min must be >= 0 and max must be >= min'
    });
  }
  
  if (params.monthRange < 0) {
    return res.status(400).json({
      success: false,
      message: 'Month range must be >= 0'
    });
  }
  
  const customerNames = [
    "Ezra Farrell",
    "Ty Costa",
    "Robin Bowers",
    "Dorian Koch",
    "Milana Kim",
    "Roman Grimes",
    "Braelyn Duke",
    "Kalel Garcia",
    "Amelia Roberson",
    "Shepherd Harris",
    "Penelope Ray",
    "Arlo Finley",
    "Jovie Craig",
    "Odin George",
    "Adelyn McCarthy",
    "Devin Wong",
    "Adelaide Harris",
    "Samuel McBride",
    "Kelsey Moore",
    "Levi Austin",
    "Alivia Rogers",
    "Colton Yang",
    "Angelina McCann",
    "Heath Blankenship",
    "Rosalee Phillips",
    "Andrew Roberson",
    "Sasha Webster",
    "Shawn Solomon",
    "Mylah Roth",
    "Roy Webb",
    "Ariella Corona",
    "Darian Leach",
    "Martha Solomon",
    "Musa Vaughn",
    "Reign Harris",
    "Samuel Raymond",
    "Hadlee Ochoa",
    "Winston Pope",
    "Aurelia Floyd",
    "Pierce Keith",
    "Elyse Todd",
    "Baylor Francis",
    "Daniella Holland",
    "Brady Parrish",
    "Tiana Wallace",
    "Chase Klein",
    "Elianna Herrera",
    "River Osborne",
    "Shelby Knight",
    "Beckett Vargas",
    "Andrea Bautista",
    "Raul Vega",
    "Dakota Chapman",
    "Knox Gilbert",
    "Jocelyn Wise",
    "Frederick Salgado",
    "Avalynn Dunn",
    "Dawson Manning",
    "Jennifer Burgess",
    "Kolton McGuire",
    "April Snyder",
    "Thiago Reeves",
    "Lana Maynard",
    "Landry Anthony",
    "Macy Hale",
    "Ezequiel Morrow",
    "Reyna Nash",
    "Chandler McGuire",
    "April Santana",
    "Mohamed Compton",
    "Elina Peck",
    "Yousef Guevara",
    "Teresa Davenport",
    "Dariel Boyle",
    "Aliya Atkinson",
    "Duke Khan",
    "Mabel Duffy",
    "Kyng Webster",
    "Kensley Lee",
    "Jack Barker",
    "Remington Barnett",
    "Stephen Rodriguez",
    "Evelyn Graves",
    "Cesar Crane",
    "Della McKay",
    "Joey Christian",
    "Anahi Stark",
    "Kristopher Manning",
    "Jennifer Lindsey",
    "Jayson Blackburn",
    "Frida Stark",
    "Kristopher Rich",
    "Sunny Alvarez",
    "Xavier Hall",
    "Leah Torres",
    "Jayden Contreras",
    "Daniela Rollins",
    "Wes Lopez",
    "Gianna Boone",
    "Mauricio Zhang",
    "Sarai Harrison",
    "Gavin Dickson",
    "Emmalynn Watkins",
    "Nash Bruce",
    "Marilyn Middleton",
    "Misael Hayes",
    "Iris Perry",
    "Waylon Galindo",
    "Corinne Shepherd",
    "Ronald Roach",
    "Lyanna Thornton",
    "Malik Hansen",
    "Hope Hodges",
    "Alonzo Le",
    "Myla Phan",
    "Maison Norris",
    "Arielle Branch",
    "Keenan Espinosa",
    "Braylee Kirk",
    "Alessandro Hickman",
    "Scarlette Wells",
    "Max Tran",
    "Kylie Travis",
    "Willie Frye",
    "Raya Valentine",
    "Demetrius Faulkner",
    "Ansley Moses",
    "Niklaus McCoy",
    "Mckenzie Franklin",
    "Simon Donovan",
    "Azariah Bautista",
    "Raul Hendricks",
    "Dani Tran",
    "Braxton Blackburn",
    "Frida Hall",
    "Thomas Jenkins",
    "Rylee Drake",
    "Jalen Jordan",
    "Adalynn Dorsey",
    "Enoch Hudson",
    "Kamila Huber",
    "Mac Walters",
    "Samara McIntosh",
    "Kristian Fletcher",
    "Anaya Sellers",
    "Madden Walls",
    "Lilianna Harris",
    "Samuel Daniels",
    "Ember Douglas",
    "Derek Peterson",
    "Caroline Cook",
    "Ezekiel Ingram",
    "Katie Dyer",
    "Atreus Bush",
    "Everlee Montgomery",
    "Maximiliano Velasquez",
    "Esme Delacruz",
    "Memphis Sellers",
    "Mercy McCoy",
    "Jett Foster",
    "Brielle Blake",
    "Zyaire Herman",
    "Paulina Le",
    "Damien Eaton",
    "Miley Allen",
    "Carter Maddox",
    "Zainab Nash",
    "Chandler Parsons",
    "Maia Berg",
    "Cayson Ellis",
    "Ayla Ward",
    "Jameson Salazar",
    "Freya Pacheco",
    "Erik Conway",
    "Ryann Allen",
    "Carter Bowen",
    "Dream Le",
    "Damien Perry",
    "Clara Carey",
    "Watson Duke",
    "Melani Kane",
    "Brock Burton",
    "Miriam Hale",
    "Ezequiel Fry",
    "Clarissa Doyle",
    "Kashton Casey",
    "Sylvia Lu",
    "Duncan Kaur",
    "Holland Stein",
    "Creed Cisneros",
    "Janelle Anthony",
    "Shiloh Ho",
    "Calliope Acosta",
    "Jensen Brandt",
    "Loretta Johnson",
    "Noah Pitts",
    "Nala Preston",
    "Vincenzo Sheppard",
    "Veda Alvarado",
    "Andres Sullivan",
    "Melanie Bass",
    "Landen Felix",
    "Paisleigh Robles",
    "Otto Noble",
    "Hunter Robles",
    "Otto Hutchinson",
    "Jamie Matthews",
    "Preston Macdonald",
    "Rosalia Fisher",
    "Gael Harrington",
    "Legacy Waller",
    "Marley Welch",
    "Amira Foster",
    "Kayden Beil",
    "Itzel Cherry",
    "Rome Singleton",
    "Malaysia Holloway",
    "Sutton Ventura",
    "Zora Wiley",
    "Mathew Greer",
    "Reina McCormick",
    "Jasiah Wilkinson",
    "Siena Anthony",
    "Shiloh Campos",
    "Sutton Walls",
    "Larry White",
    "Layla Ochoa",
    "Winston Fields",
    "Annie Kerr",
    "Louie McDaniel",
    "Dahlia Huerta",
    "Douglas Potts",
    "Ellison Curtis",
    "Muhammad Fischer",
    "Maci Crosby",
    "Tristen Bennett",
    "Josephine Sparks",
    "Drake Foster",
    "Brielle Moses",
    "Niklaus Weber",
    "Alayah Magana",
    "Rey Nelson",
    "Everly Peralta",
    "Dangelo Vance",
    "Maxine Schmitt",
    "Murphy Jennings",
    "Palmer Yang",
    "Malcolm Faulkner",
    "Ansley O'Neill",
    "Marcel Bradley",
    "Vanessa Nunez",
    "Caden Alfaro",
    "Yasmin Boyd",
    "Dean Williams",
    "Ava Koch",
    "Salvador Conner",
    "Alondra Jimenez",
    "Silas Torres",
    "Violet Castillo",
    "Kai Romero",
    "Eliza Wang",
    "Cohen Lyons",
    "Kenzie Collier",
    "Edison Ryan",
    "Morgan Carroll",
    "Oscar Villanueva",
    "Monroe Baker",
    "Ezra Sexton",
    "Ellen Vo",
    "Gordon Reynolds",
    "Isabelle Silva",
    "Luka Lawrence",
    "Lauren Salazar",
    "Brody Knapp",
    "Linda Patrick",
    "Derrick Howard",
    "Sophie Pineda",
    "Gerardo Black",
    "Molly O'Neill",
    "Marcel Hurley",
    "Rylan Tate",
    "Dalton Dominguez",
    "Raegan Rollins",
    "Wes Espinosa",
    "Braylee Duncan",
    "Avery Caldwell",
    "Evelynn Fleming",
    "Fernando Lim",
    "Giavanna Anderson",
    "Jacob Parrish",
    "Tiana Rivera",
    "Charles Sanchez",
    "Aria Hines",
    "Uriel Bauer",
    "Haley Moyer",
    "Ahmir Bennett",
    "Josephine Cunningham",
    "Alejandro Espinoza",
    "Lucille Hobbs",
    "Brendan Carroll",
    "Zara Cano",
    "Terry Vang",
    "Madisyn O'brien",
    "Riley Le",
    "Myla Barrera",
    "Makai Barr",
    "Noemi Suarez",
    "Soren Richards",
    "Trinity Moss",
    "Porter Reid",
    "Charlee Dixon",
    "Camden Hahn",
    "Fallon Giles",
    "Kole Harvey",
    "Nicole Wagner",
    "Enzo Le",
    "Myla Powell",
    "Bennett Dunn",
    "Olive Branch",
    "Keenan Patel",
    "Madeline Lambert",
    "Mario Nash",
    "Novah Mathis",
    "Gustavo Davis",
    "Mia Dean",
    "Ronan Stuart",
    "Stormi Haynes",
    "Kason Joseph",
    "Gracelynn Rogers",
    "Colton Lambert",
    "Nina Salas",
    "Zaiden Bowen",
    "Dream Brooks",
    "Jordan Schultz",
    "Briella Farmer",
    "Jamison Barber",
    "Cassidy Roach",
    "Caspian Pugh",
    "Landry Knapp",
    "Boden Doyle",
    "Annalise Spencer",
    "Ace Willis",
    "Alexa McClure",
    "Reese Nunez",
    "Mya Smith",
    "Liam Hawkins",
    "Ariel Carson",
    "Ares Stark",
    "Kamilah Greer",
    "Koda Berry",
    "Annabelle Galindo",
    "Salvatore Bridges",
    "Elora Finley",
    "Calum Ferguson",
    "Juliana Skinner",
    "Ridge Reeves",
    "Lana Christian",
    "Ledger Bautista",
    "Antonella Blevins",
    "Avi Banks",
    "Cali Cross",
    "Fabian Ahmed",
    "Jolie McKee",
    "Bjorn Curtis",
    "Alexis Miller",
    "Benjamin Holland",
    "Mariah Robles",
    "Otto Barnett",
    "Harlow Whitehead",
    "Zayd Hart",
    "Gemma Stewart",
    "Nolan Moreno",
    "Mary Kaur",
    "Augustine Hicks",
    "Alina Pennington",
    "Bobby Jennings",
    "Palmer Bautista",
    "Raul Archer",
    "Kadence Morton",
    "Roland Trevino",
    "Priscilla Todd",
    "Baylor Moran",
    "Celeste Macdonald",
    "Hugh Murray",
    "Faith Ponce",
    "Langston Roach",
    "Lyanna Richmond",
    "Mordechai Hutchinson",
    "Jamie Decker",
    "Taylor Huang",
    "Francesca Johnston",
    "Felix Nava",
    "Scout Boone",
    "Mauricio Solis",
    "Miracle Adkins",
    "Kylo Allen",
    "Riley Rice",
    "Graham Mitchell",
    "Willow Douglas",
    "Derek Pennington",
    "Yareli Silva",
    "Luka Foster",
    "Brielle Parker",
    "Caleb Clay",
    "Aliana Conrad",
    "Dilan Lugo",
    "Kaylie Garner",
    "Sage Gordon",
    "Taylor Andrade",
    "Abdiel McFarland",
    "Annika Wright",
    "Grayson Fletcher",
    "Anaya Levy",
    "Harold Richards",
    "Trinity Watkins",
    "Nash Gallagher",
    "Elliott Stanton",
    "Zyair Flynn",
    "Dorothy Morgan",
    "Hunter McMahon",
    "Belen Donaldson",
    "Canaan Dixon",
    "Blakely Brewer",
    "Cruz Barry",
    "Waverly Goodman",
    "Philip Orr",
    "Alaiya Delarosa",
    "Osiris Lozano",
    "Cecelia Ali",
    "Arjun Daugherty",
    "Magdalena Cobb",
    "Raphael Heath",
    "Amani Estes",
    "Hakeem Hoover",
    "Virginia Brandt",
    "Damir Ramsey",
    "Lyric Rich",
    "Miller Washington",
    "Valerie Horn",
    "Wilson Reyna",
    "Luella Cochran",
    "Danny Potts",
    "Ellison Gibbs",
    "Deacon Lim",
    "Giavanna Park",
    "Daxton Meadows",
    "Pearl Hale",
    "Ezequiel Conway",
    "Ryann Bell",
    "Emmett Dorsey",
    "Addyson Russo",
    "Jamie Zavala",
    "Liv Conner",
    "Phillip Aguirre",
    "Ariah Watts",
    "Dakota Jaramillo",
    "Guadalupe Gomez",
    "Isaiah Pennington",
    "Yareli Barron",
    "Dustin Taylor",
    "Sofia Wood",
    "Carson Diaz",
    "Elena Stein",
    "Creed Perez",
    "Eleanor Bennett",
    "Leonardo Cox",
    "Sadie King",
    "Julian Herring",
    "Denver Thompson",
    "Theodore Greer",
    "Reina Bradshaw",
    "Emory Holland",
    "Mariah Benitez",
    "Justice Daniels",
    "Ember Ho",
    "Morgan Bennett",
    "Josephine Rich",
    "Miller Sanford",
    "Emerald Choi",
    "Khari Palmer",
    "Juniper Cole",
    "Nathaniel Noble",
    "Hunter Mayer",
    "Yahir Lucero",
    "Ila Holt",
    "Niko Hurley",
    "Rylan Morgan",
    "Hunter Keller",
    "Logan Villalobos",
    "Reuben Perez",
    "Eleanor Lowery",
    "Jaxxon Gentry",
    "Amelie Solis",
    "Ronin Lopez",
    "Gianna Kerr",
    "Louie Cherry",
    "Nyomi Dunn",
    "Dawson O'brien",
    "Joanna Parks",
    "Gianni Lopez",
    "Gianna Stevens",
    "Zachary Hayes",
    "Iris Montes",
    "Darren Simpson",
    "Anastasia George",
    "Mark Hopkins",
    "Gabriela Wheeler",
    "Kenneth Brooks",
    "Autumn Davis",
    "Lucas Castillo",
    "Eva Barrett",
    "Angelo Parrish",
    "Tiana Mason",
    "Brandon David",
    "Haylee Lara",
    "Caiden Bond",
    "Alena Villarreal",
    "Nikolai Enriquez",
    "Nellie Wright",
    "Grayson Ray",
    "Ruth Thomas",
    "Logan Vance",
    "Maxine Zuniga",
    "Sincere Curtis",
    "Alexis Schneider",
    "Raymond Lu",
    "Emani Blankenship",
    "Ernesto Orozco",
    "Renata Rosas",
    "Remi Torres",
    "Violet Cortez",
    "Zayn Carrillo",
    "Kaylani Townsend",
    "Alexis Fox",
    "Juliette Harvey",
    "Cayden Bauer",
    "Haley Trejo",
    "Wesson Barton",
    "Danna Johns",
    "Joziah Gonzales",
    "Hadley Kramer",
    "Kylan Robles",
    "Felicity Le",
    "Damien Saunders",
    "Meadow Greene",
    "Griffin Grimes",
    "Braelyn Wilkinson",
    "Leonard Weber",
    "Alayah Lawson",
    "Lane Camacho",
    "Armani McKee",
    "Bjorn Collier",
    "Ivory Liu",
    "Pedro Bernard",
    "Barbara Portillo",
    "Wallace Ho",
    "Calliope Ramirez",
    "David Roach",
    "Lyanna Waters",
    "Maximilian Hart",
    "Gemma Estrada",
    "Phoenix Neal",
    "Talia Delgado",
    "Colt Snow",
    "Alexia Patton",
    "Moises Romero",
    "Eliza Pham",
    "Russell Kennedy",
    "Brianna Chase",
    "Otis Dalton",
    "Lilian Wood",
    "Carson Salazar",
    "Freya Beck",
    "Eduardo Noble",
    "Hunter Boone",
    "Mauricio Hudson",
    "Kamila Andersen",
    "Alistair Garner",
    "Jacqueline Holmes",
    "King Conway",
    "Ryann Henry",
    "Carlos Douglas",
    "Aniyah Benson",
    "Desmond Moran",
    "Celeste Blair",
    "Troy Arroyo",
    "Kyra Barajas",
    "Brennan Coleman",
    "Julia Vargas",
    "Ryker Harris",
    "Penelope Cortes",
    "Banks Cummings",
    "Nylah Beard",
    "Nathanael Fowler",
    "Lennon Barber",
    "Solomon Maldonado",
    "Elaina Love",
    "Jeffrey Walsh",
    "Leia Moon",
    "Nova Sanford",
    "Emerald Shepherd",
    "Ronald Murillo",
    "Mikaela Clarke",
    "Stetson Clark",
    "Chloe Reyes",
    "Eli Tapia",
    "Michaela Jenkins",
    "Declan Compton",
    "Elina Stevenson",
    "Callan Nguyen",
    "Nova Hendrix",
    "Korbyn Simmons",
    "Reagan Maxwell",
    "Eden Duarte",
    "Kynlee Page",
    "Pablo Cuevas",
    "Adele Graves",
    "Cesar Proctor",
    "Chandler Huber",
    "Mac Gilbert",
    "Jocelyn Deleon",
    "Nasir Cortez",
    "Haven Carrillo",
    "Wade Howe",
    "Persephone Foley",
    "Mohammad Duke",
    "Melani Diaz",
    "Nathan Haynes",
    "Lexi Sparks",
    "Drake Perry",
    "Clara Frank",
    "Braylen Baxter",
    "Lara McCoy",
    "Jett Bass",
    "Zahra Norman",
    "Aziel Rosario",
    "Louisa George",
    "Mark Daugherty",
    "Magdalena Rodriguez",
    "Henry Sawyer",
    "Marina Snow",
    "Houston Sims",
    "Lena Scott",
    "Leo Montes",
    "Roselyn McCann",
    "Heath Wyatt",
    "Liberty Arnold",
    "Abraham Jensen",
    "Jane Archer",
    "Ephraim Houston",
    "Lylah Charles",
    "Conrad Rivas",
    "Averie Ward",
    "Jameson Price",
    "Piper Cuevas",
    "Brecken Collins",
    "Kinsley Deleon",
    "Nasir Vaughan",
    "Nancy Austin",
    "Omar Davidson",
    "Jayla Phillips",
    "Andrew Howell",
    "Mckenna Cameron",
    "Rayan Chambers",
    "Makayla Calderon",
    "Oakley McCarthy",
    "Kira Flowers",
    "Saul Carlson",
    "Kali Rivera",
    "Charles Larsen",
    "Xiomara Dudley",
    "Colter Espinosa",
    "Braylee Donaldson",
    "Canaan McCall",
    "Kai Jacobson",
    "Legacy Hinton",
    "Jaelynn Salazar",
    "Brody Potts",
    "Ellison Hale",
    "Ezequiel Villanueva",
    "Monroe Shaw",
    "Elliot Kim",
    "Gabriella Rose",
    "Hayden Villa",
    "Johanna Solomon",
    "Musa Copeland",
    "Dayana Kerr",
    "Louie Donovan",
    "Azariah Mejia",
    "Atticus Chan",
    "Hattie Dodson",
    "Seven Porter",
    "Ryleigh Reilly",
    "Alvaro Wyatt",
    "Liberty Carr",
    "Kash Griffith",
    "Alicia Mercado",
    "Abram Noble",
    "Hunter Ashley",
    "Kylen Fleming",
    "Fatima Willis",
    "Remington Shields",
    "Analia Small",
    "Rudy Erickson",
    "Sabrina Roth",
    "Roy Joseph",
    "Gracelynn Dixon",
    "Camden Herman",
    "Paulina Avila",
    "Jaylen Wu",
    "Liana Morales",
    "Aaron Jennings",
    "Palmer Maxwell",
    "Eden Phelps",
    "Laney Booker",
    "Dominik Odom",
    "Laylani Rich",
    "Miller Thornton",
    "Haisley McKinney",
    "Romeo Humphrey",
    "Journi Reyna",
    "Reginald Crosby",
    "Keily Ball",
    "Shane Beard",
    "Ezra Pierce",
    "Nicolas Boyd",
    "Georgia Glenn",
    "Zaid Torres",
    "Violet Benton",
    "Jamal Clay",
    "Aliana Kline",
    "Ramon Bryant",
    "Parker Li",
    "Jorge Hancock",
    "Katelyn Whitney",
    "Jeffery Kane",
    "Ellianna Donovan",
    "Brayan Murray",
    "Faith Raymond",
    "Maurice Villalobos",
    "Zoya Coleman",
    "Micah Kelley",
    "Rosalie Brandt",
    "Damir Davis",
    "Mia Avila",
    "Jaylen Lester",
    "Averi Guzman",
    "Jude Wallace",
    "Arianna Ballard",
    "Kenzo Henderson",
    "Maria Stewart",
    "Nolan McMillan",
    "Oakleigh Franco",
    "Gage Bender",
    "Lilyana Lynch",
    "Zane McDaniel",
    "Dahlia Marsh",
    "Bo Rocha",
    "Emmie Bradley",
    "Richard Tucker",
    "Esther Pittman",
    "Valentino Cervantes",
    "Aylin Patton",
    "Moises Cochran",
    "Alma Collier",
    "Edison Macias",
    "Adley Stokes",
    "Santana Garrett",
    "Tessa Foster",
    "Kayden Donovan",
    "Azariah Krueger",
    "Jones Hobbs",
    "Lacey Quinn",
    "Rhys Compton",
    "Elina Arnold",
    "Abraham Marks",
    "Monica Richardson",
    "Robert Morse",
    "Kairi Lucero",
    "Felipe Castillo",
    "Eva Nguyen",
    "Gabriel Atkinson",
    "Jazmin Fischer",
    "Leonidas Dunlap",
    "Iliana Jensen",
    "Cash Evans",
    "Eliana Anthony",
    "Shiloh Frank",
    "Dior McCann",
    "Heath Reyna",
    "Luella Faulkner",
    "Jabari Douglas",
    "Aniyah Meza",
    "Lucian Weiss",
    "Lennox Pearson",
    "Gunner Sims",
    "Lena Faulkner",
    "Jabari Todd",
    "Zariah Portillo",
    "Wallace Rosales",
    "Kinley White",
    "Aiden Vance",
    "Maxine Farrell",
    "Ty Ray",
    "Ruth Howard",
    "Jeremiah Pham",
    "Raelyn Hubbard",
    "Forrest Hendricks",
    "Dani Richmond",
    "Mordechai Prince",
    "Greta Wood",
    "Carson Booker",
    "Nataly Sierra",
    "Dayton Hardy",
    "Jessica Gregory",
    "Travis Morris",
    "Genesis Rose",
    "Hayden Bartlett",
    "Aubrielle Gonzalez",
    "Ethan Rios",
    "Brooke Wagner",
    "Enzo Woodard",
    "Aubrie Melendez",
    "Nikolas Hayes",
    "Iris Dawson",
    "Iker Odom",
    "Laylani Bentley",
    "Randy McCarty",
    "Halo Wang",
    "Cohen Velasquez",
    "Esme Zuniga",
    "Sincere Morris",
    "Genesis Welch",
    "Hendrix Espinosa",
    "Braylee Fischer",
    "Leonidas Richmond",
    "Whitney Nicholson",
    "Rodrigo Reese",
    "Rosemary McDaniel",
    "Major Padilla",
    "Maggie Nguyen",
    "Gabriel Gallagher",
    "Elliott Gibson",
    "Tyler Oliver",
    "Camille Hardin",
    "Hassan Galindo",
    "Corinne Galvan",
    "Kingsley Krueger",
    "Kamari Medrano",
    "Arian Rich",
    "Sunny McConnell",
    "London Portillo",
    "Nathalie Gould",
    "Blaine Douglas",
    "Aniyah Costa",
    "Kenji Wilcox",
    "Ashlyn English",
    "Junior Lang",
    "Amirah Spears",
    "Ameer Berger",
    "Laylah Salinas",
    "Edgar Kent",
    "Jazmine Clark",
    "John Terrell",
    "Paityn Bailey",
    "Axel Oliver",
    "Camille Levy",
    "Harold Aguirre",
    "Ariah Villegas",
    "Clyde Arnold",
    "Finley Carson",
    "Ares Velasquez",
    "Esme McKinney",
    "Romeo Galindo",
    "Corinne Rice",
    "Graham Mayer",
    "Ainhoa Contreras",
    "Emilio Sweeney",
    "Yara Bryan",
    "Jaxtyn Elliott",
    "Noelle Gutierrez",
    "Luca Gregory",
    "Alaya Nicholson",
    "Rodrigo Wallace",
    "Arianna Reed",
    "Easton English",
    "Kelly Marquez",
    "Malakai Reed",
    "Valentina Liu",
    "Pedro Chen",
    "Valeria Enriquez",
    "Elisha Farrell",
    "Kassidy Higgins",
    "Sterling Carlson",
    "Kali Harris",
    "Samuel Guerra",
    "Edith Macdonald",
    "Hugh Andersen",
    "Zoie Bailey",
    "Axel Munoz",
    "Kehlani Delgado",
    "Colt Myers",
    "Lydia Rocha",
    "Onyx Savage",
    "Louise Navarro",
    "Reid Lopez",
    "Gianna Santiago",
    "Beckham Mosley",
    "Zaniyah Parrish",
    "Karsyn Henson",
    "Kinslee Garrison",
    "Noe Beil",
    "Itzel Freeman",
    "Jayce Floyd",
    "Yaretzi Cook",
    "Ezekiel Tanner",
    "Harmoni Salas",
    "Zaiden Quintana",
    "Kenia Chapman",
    "Knox Hendrix",
    "Zhuri Schwartz",
    "Edwin Cross",
    "Nayeli Bradford",
    "Ander Bush",
    "Everlee Stone",
    "Finn Nguyen",
    "Nova Stout",
    "Callahan Lester",
    "Averi Donaldson",
    "Canaan Mendez",
    "Londyn Hess",
    "Lawrence Cobb",
    "Aviana Marsh",
    "Bo Campbell",
    "Addison Woodard",
    "Westley Mitchell",
    "Willow Nolan",
    "Maximo Daniels",
    "Ember Warner",
    "Jaxton Evans",
    "Eliana Bruce",
    "Uriah Lynn",
    "Samira Richardson",
    "Robert Rocha",
    "Emmie Nixon",
    "Cory Gross",
    "Angel Murray",
    "Ashton Navarro",
    "Winter Schultz",
    "Cody Lam",
    "Karina McPherson",
    "Foster Fischer",
    "Maci Acevedo",
    "Dakari Lowery",
    "Estelle Terrell",
    "Jaxen Dunlap",
    "Iliana Burnett",
    "Davis Holt",
    "Adelynn Benitez",
    "Justice Lee",
    "Scarlett Elliott",
    "Blake Fisher",
    "Arya Lang",
    "Wells Kim",
    "Gabriella Lopez",
    "Michael Griffith",
    "Alicia Silva",
    "Luka Rasmussen",
    "Esperanza Elliott",
    "Blake Clark",
    "Chloe Salinas",
    "Edgar Chambers",
    "Makayla Ayala",
    "Tanner Day",
    "Hayden Ali",
    "Arjun Gray",
    "Sarah Mills",
    "Alex Bowen",
    "Dream Dominguez",
    "Kaden Manning",
    "Jennifer Long",
    "Jace Mora",
    "Jemma Brady",
    "Reed Morton",
    "Mallory Barrera",
    "Makai English",
    "Kelly Davenport",
    "Dariel Walker",
    "Hazel Enriquez",
    "Elisha Simmons",
    "Reagan Baxter",
    "Tomas Paul",
    "Daphne Miranda",
    "Rory Weaver",
    "Teagan Hanna",
    "Aydin Blair",
    "Frances Ayala",
    "Tanner Macias",
    "Adley Cruz",
    "Ryan Chang"
    ];
  
  const dogNames = [
    'Max', 'Bella', 'Charlie', 'Lucy', 'Cooper', 'Luna', 'Buddy', 'Daisy', 'Rocky', 'Lola', 
    'Jack', 'Sadie', 'Toby', 'Molly', 'Bear', 'Bailey', 'Duke', 'Maggie', 'Tucker', 'Sophie', 
    'Oliver', 'Chloe', 'Teddy', 'Penny', 'Winston', 'Rosie', 'Sam', 'Zoe', 'Bentley', 'Ruby', 
    'Milo', 'Lily', 'Leo', 'Coco', 'Jax', 'Stella', 'Zeus', 'Gracie', 'Archie', 'Nala', 
    'Oscar', 'Millie', 'Louie', 'Abby', 'Diesel', 'Roxy', 'Rex', 'Willow', 'Bruno', 'Pepper', 
    'Murphy', 'Ginger', 'Finn', 'Lulu', 'Moose', 'Dixie', 'Gus', 'Princess', 'Koda', 'Ellie', 
    'Buster', 'Annie', 'Marley', 'Piper', 'Ziggy', 'Nova', 'Sammy', 'Riley', 'Rusty', 'Kona', 
    'Lucky', 'Olive', 'Jake', 'Hazel', 'Blue', 'Belle', 'Apollo', 'Layla', 'Henry', 'Harley', 
    'Scout', 'Winnie', 'Jasper', 'Phoebe', 'Baxter', 'Ella', 'Bandit', 'Honey', 'Ace', 'Emma', 
    'Thor', 'Izzy', 'Oakley', 'Athena', 'Cody', 'Sasha', 'Dexter', 'Maya', 'Ollie', 'Lexi',
    // Additional dog names
    'Simba', 'Cleo', 'Benji', 'Poppy', 'Oreo', 'Peanut', 'Shadow', 'Mia', 'Rocco', 'Trixie',
    'Kobe', 'Skye', 'Beau', 'Misty', 'Odin', 'Pixie', 'Axel', 'Leia', 'Chewy', 'Nora',
    'Rufus', 'Callie', 'Hank', 'Josie', 'Otis', 'Bonnie', 'Roscoe', 'Minnie', 'Wally', 'Dottie',
    'Monty', 'Fiona', 'Barney', 'Delilah', 'Chip', 'Ivy', 'Ozzy', 'Remi', 'Theo', 'Cora',
    'Mack', 'Heidi', 'Brody', 'Violet', 'Gunner', 'Tilly', 'Samson', 'Dolly', 'Benny', 'Wilma',
    'Rudy', 'Xena', 'Juno', 'Buttercup', 'Dash', 'Maple', 'Cosmo', 'Sunny', 'Gizmo', 'Clover',
    'Whiskey', 'Peaches', 'Bolt', 'Olive', 'Goose', 'Pebbles', 'Rambo', 'Birdie', 'Boomer', 'Polly',
    'Maverick', 'Gracie', 'Kylo', 'Elsa', 'Yoda', 'Nala', 'Groot', 'Arya', 'Dobby', 'Khaleesi',
    'Sherlock', 'Willow', 'Watson', 'Freya', 'Merlin', 'Zelda', 'Gandalf', 'Ripley', 'Tyrion', 'Hermione',
    'Loki', 'Sansa', 'Draco', 'Katniss', 'Sirius', 'Daenerys', 'Hagrid', 'Bellatrix', 'Frodo', 'Mystique',
    'Mocha', 'Cookie', 'Pepper', 'Biscuit', 'Cocoa', 'Muffin', 'Brownie', 'Waffles', 'Toffee', 'Snickers',
    'Pickles', 'Nacho', 'Taco', 'Nugget', 'Donut', 'Noodle', 'Beans', 'Pretzel', 'Churro', 'Bagel',
    'Kiwi', 'Mango', 'Coconut', 'Pumpkin', 'Olive', 'Ginger', 'Pepper', 'Basil', 'Sage', 'Cinnamon',
    'Banjo', 'Jagger', 'Elvis', 'Hendrix', 'Bowie', 'Zeppelin', 'Marley', 'Lennon', 'Ozzy', 'Sinatra',
    'Astro', 'Comet', 'Rocket', 'Orbit', 'Pluto', 'Nebula', 'Cosmo', 'Nova', 'Galaxy', 'Jupiter'
  ];
  
  try {
    await connection.beginTransaction();
    
    // First, clear existing data
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE ServiceAppointmentDog');
    await connection.query('TRUNCATE TABLE AppointmentDog');
    await connection.query('TRUNCATE TABLE DogDogbreed');
    await connection.query('TRUNCATE TABLE Appointment');
    await connection.query('TRUNCATE TABLE Dog');
    await connection.query('TRUNCATE TABLE Customer');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Get dog breeds and sizes for later use
    const [dogBreeds] = await connection.query<RowDataPacket[]>('SELECT Id FROM Statics_Dogbreed');
    const [dogSizes] = await connection.query<RowDataPacket[]>('SELECT Id FROM Statics_DogSize');
    const [services] = await connection.query<RowDataPacket[]>('SELECT Id, StandardPrice FROM Statics_Service');
    
    // Create customers
    const customers: number[] = [];
    
    // Create customers in order from the array to ensure uniqueness
    for (let i = 0; i < params.numCustomers; i++) {
      const fullName = customerNames[i];
      
      // Split the full name into first and last name for email generation
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Unknown';
      
      // Generate phone number
      const phoneNumber = `06${Math.floor(10000000 + Math.random() * 90000000)}`;
      
      // Generate email
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
      
      const [result] = await connection.query<ResultSetHeader>(
        'INSERT INTO Customer (Name, Contactperson, Email, Phone, Notes, IsExported, IsAllowContactShare) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          fullName,
          fullName, // Contact person is the same as name
          email,
          phoneNumber,
          i % 3 === 0 ? `${firstName} has multiple dogs that need special attention` : '',
          false,
          'Yes'
        ]
      );
      customers.push(result.insertId);
    }
    
    // Create dogs per customer
    const dogs: { id: number, customerId: number }[] = [];
    const usedDogNames = new Map<number, Set<string>>();
    
    for (const customerId of customers) {
      // Ensure at least some customers have multiple dogs for multi-dog appointments
      // Use the configured min/max range
      const numDogs = customerId % 3 === 0 
        ? Math.max(2, Math.floor(Math.random() * (params.maxDogsPerCustomer - params.minDogsPerCustomer + 1)) + params.minDogsPerCustomer)
        : Math.floor(Math.random() * (params.maxDogsPerCustomer - params.minDogsPerCustomer + 1)) + params.minDogsPerCustomer;
      
      usedDogNames.set(customerId, new Set<string>());
      
      for (let i = 0; i < numDogs; i++) {
        // Random dog size
        const dogSizeId = dogSizes[Math.floor(Math.random() * dogSizes.length)].Id;
        
        // Random birthday between 1 and 10 years ago
        const today = new Date();
        const yearsAgo = Math.floor(Math.random() * 10) + 1;
        const birthday = new Date(today.getFullYear() - yearsAgo, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        
        // Get unique dog name for this customer
        let dogName;
        do {
          dogName = dogNames[Math.floor(Math.random() * dogNames.length)];
        } while (usedDogNames.get(customerId)?.has(dogName));
        
        usedDogNames.get(customerId)?.add(dogName);
        
        const [dogResult] = await connection.query<ResultSetHeader>(
          'INSERT INTO Dog (CustomerId, Name, Birthday, Allergies, ServiceNote, DogSizeId) VALUES (?, ?, ?, ?, ?, ?)',
          [
            customerId,
            dogName,
            birthday.toISOString().split('T')[0],
            i % 4 === 0 ? 'Has allergies to certain shampoos' : '',
            i % 5 === 0 ? 'Needs special handling, can be nervous around other dogs' : '',
            dogSizeId
          ]
        );
        
        const dogId = dogResult.insertId;
        dogs.push({ id: dogId, customerId });
        
        // Add 1-2 breeds per dog
        const numBreeds = Math.floor(Math.random() * 2) + 1;
        const usedBreeds = new Set<string>();
        
        for (let j = 0; j < numBreeds; j++) {
          let breedIndex;
          let breedId;
          
          // Ensure we don't add the same breed twice
          do {
            breedIndex = Math.floor(Math.random() * dogBreeds.length);
            breedId = dogBreeds[breedIndex].Id;
          } while (usedBreeds.has(breedId));
          
          usedBreeds.add(breedId);
          
          await connection.query(
            'INSERT INTO DogDogbreed (DogId, DogBreedId) VALUES (?, ?)',
            [dogId, breedId]
          );
        }
      }
    }
    
    // Create appointments spanning the configured month range
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight
    
    // Start date: First day of (current month - monthRange)
    const startDate = new Date(today.getFullYear(), today.getMonth() - params.monthRange, 1);
    startDate.setHours(0, 0, 0, 0); // Reset time to midnight
    
    // End date: Last day of (current month + monthRange)
    const endDate = new Date(today.getFullYear(), today.getMonth() + params.monthRange + 1, 0);
    endDate.setHours(0, 0, 0, 0); // Reset time to midnight
    
    console.log(`Generating appointments from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    // Group dogs by customer for multi-dog appointments
    const dogsByCustomer = new Map<number, number[]>();
    for (const dog of dogs) {
      if (!dogsByCustomer.has(dog.customerId)) {
        dogsByCustomer.set(dog.customerId, []);
      }
      dogsByCustomer.get(dog.customerId)?.push(dog.id);
    }
    
    // Filter customers with multiple dogs for multi-dog appointments
    const customersWithMultipleDogs = Array.from(dogsByCustomer.entries())
      .filter(([_, dogIds]) => dogIds.length >= 2)
      .map(([customerId, _]) => customerId);
    
    // Generate appointments for each day
    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      // Create a new date object to avoid any potential reference issues
      const processDate = new Date(currentDate.getTime());
      processDate.setHours(0, 0, 0, 0); // Reset time to midnight
      
      // Helper function to get the correct day of week
      const getDayOfWeek = (date: Date): number => {
        // Create a new date object with the date string to ensure consistent behavior
        const dateStr = date.toISOString().split('T')[0];
        const newDate = new Date(dateStr + 'T00:00:00.000Z');
        return newDate.getDay();
      };
      
      // Verify the day of week is correct using the helper function
      const actualDayOfWeek = getDayOfWeek(processDate);
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dateStr = processDate.toISOString().split('T')[0];
      
      // Skip weekends (Saturday and Sunday)
      if (actualDayOfWeek === 0 || actualDayOfWeek === 6) {
        console.log(`Skipping weekend: ${dateStr}, ${dayNames[actualDayOfWeek]}`);
        continue;
      }
      
      // Check if it's Friday - use the actual day of week
      const isFriday = actualDayOfWeek === 5;
      
      console.log(`Creating appointments for ${dateStr}, ${dayNames[actualDayOfWeek]}`);
      
      // Random number of appointments per day within the configured range
      // For Fridays, create a fixed number of appointments for consistency
      const numAppointments = isFriday ? 
        3 : // Fixed number for Fridays
        Math.floor(Math.random() * (params.maxAppointmentsPerDay - params.minAppointmentsPerDay + 1)) + params.minAppointmentsPerDay;
      
      // Business hours: 9:00 to 17:00
      const startHour = 9;
      const endHour = 17;
      
      // Create appointments for this day
      for (let i = 0; i < numAppointments; i++) {
        // Only create appointment if we have dogs
        if (dogs.length === 0) continue;
        
        // Decide if this will be a multi-dog appointment (30% chance if we have customers with multiple dogs)
        // For Fridays, always create single-dog appointments for consistency
        const isMultiDogAppointment = 
          !isFriday && 
          customersWithMultipleDogs.length > 0 && 
          Math.random() < 0.3;
        
        let customerId, dogIds;
        
        if (isMultiDogAppointment) {
          // Select a random customer with multiple dogs
          const customerIndex = Math.floor(Math.random() * customersWithMultipleDogs.length);
          customerId = customersWithMultipleDogs[customerIndex];
          
          // Get all dogs for this customer
          dogIds = dogsByCustomer.get(customerId) || [];
          
          // If they have more than 2 dogs, randomly select 2-3 of them
          if (dogIds.length > 3) {
            const numDogsToInclude = Math.floor(Math.random() * 2) + 2; // 2-3 dogs
            dogIds = dogIds
              .sort(() => 0.5 - Math.random()) // Shuffle array
              .slice(0, numDogsToInclude);     // Take first 2-3 elements
          }
        } else {
          // Random dog (and its owner) for single dog appointment
          const dogIndex = Math.floor(Math.random() * dogs.length);
          const dog = dogs[dogIndex];
          customerId = dog.customerId;
          dogIds = [dog.id];
        }
        
        // Random start time between business hours
        // For Fridays, use a more restricted time range to ensure visibility
        const hour = isFriday ? 
          10 + Math.floor(Math.random() * 4) : // 10:00 to 13:00 for Fridays
          startHour + Math.floor(Math.random() * (endHour - startHour - 1));
        const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45
        
        // Random duration between 30 minutes and 2 hours
        // For multi-dog appointments, make the duration longer
        const baseDuration = (Math.floor(Math.random() * 4) + 1) * 30;
        const durationMinutes = isMultiDogAppointment ? 
          baseDuration + 30 * dogIds.length : // Add 30 min per dog for multi-dog appointments
          baseDuration;
        
        // Calculate end time
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        const endHourRaw = hour + Math.floor((minute + durationMinutes) / 60);
        const endMinuteRaw = (minute + durationMinutes) % 60;
        const endTime = `${endHourRaw.toString().padStart(2, '0')}:${endMinuteRaw.toString().padStart(2, '0')}:00`;
        
        // Format date for MySQL - already calculated above as dateStr
        
        // Set appointment status - all appointments should be planned
        const appointmentStatusId = 'Pln'; // Always set to planned
        
        // Insert appointment
        const [appointmentResult] = await connection.query<ResultSetHeader>(
          'INSERT INTO Appointment (Date, TimeStart, TimeEnd, DateEnd, ActualDuration, CustomerId, AppointmentStatusId, Note, SerialNumber, IsPaidInCash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            dateStr,
            startTime,
            endTime,
            dateStr,
            durationMinutes,
            customerId,
            appointmentStatusId,
            isMultiDogAppointment ? 
              `Multiple dog grooming session for ${dogIds.length} dogs` : 
              (i % 3 === 0 ? 'Regular grooming appointment' : ''),
            0, // Serial number always set to 0
            Math.random() > 0.7 // 30% chance of being paid in cash
          ]
        );
        
        const appointmentId = appointmentResult.insertId;
        
        // Link dogs to appointment
        for (const dogId of dogIds) {
          const [appointmentDogResult] = await connection.query<ResultSetHeader>(
            'INSERT INTO AppointmentDog (AppointmentId, DogId, Note) VALUES (?, ?, ?)',
            [
              appointmentId,
              dogId,
              isMultiDogAppointment ? 
                'Part of multi-dog appointment, handle dogs one at a time' : 
                (i % 4 === 0 ? 'Dog needs special handling, be gentle around the ears' : '')
            ]
          );
          
          const appointmentDogId = appointmentDogResult.insertId;
          
          // Add services for this dog
          // Most dogs should have only a single service
          // Only 20% of dogs should have multiple services (or if it's a multi-dog appointment)
          const shouldAddMultipleServices = isMultiDogAppointment || Math.random() < 0.2;
          
          if (shouldAddMultipleServices) {
            // For dogs with multiple services, add 2-3 services (or all if there are only a few)
            const numServicesToAdd = Math.min(services.length, Math.floor(Math.random() * 2) + 2); // 2-3 services
            
            // Shuffle services array to get random services
            const shuffledServices = [...services].sort(() => 0.5 - Math.random());
            
            // Add the selected number of services
            for (let j = 0; j < numServicesToAdd; j++) {
              const service = shuffledServices[j];
              
              // Random price variation (±10%)
              let price = service.StandardPrice;
              if (service.StandardPrice > 0) {
                const variation = (Math.random() * 0.2) - 0.1; // -10% to +10%
                price = Math.round((service.StandardPrice * (1 + variation)) * 100) / 100;
              }
              
              await connection.query(
                'INSERT INTO ServiceAppointmentDog (ServiceId, AppointmentDogId, Price) VALUES (?, ?, ?)',
                [service.Id, appointmentDogId, price]
              );
            }
          } else {
            // For most dogs, add just a single service
            const serviceIndex = Math.floor(Math.random() * services.length);
            const service = services[serviceIndex];
            
            // Random price variation (±10%)
            let price = service.StandardPrice;
            if (service.StandardPrice > 0) {
              const variation = (Math.random() * 0.2) - 0.1; // -10% to +10%
              price = Math.round((service.StandardPrice * (1 + variation)) * 100) / 100;
            }
            
            await connection.query(
              'INSERT INTO ServiceAppointmentDog (ServiceId, AppointmentDogId, Price) VALUES (?, ?, ?)',
              [service.Id, appointmentDogId, price]
            );
          }
        }
      }
    }
    
    await connection.commit();
    
    res.status(200).json({
      success: true,
      message: 'Test data generated successfully',
      summary: {
        customers: customers.length,
        dogs: dogs.length,
        appointments: `Appointments created from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        features: 'Includes multi-dog appointments and some dogs with multiple services',
        configuration: params
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error generating test data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
}; 