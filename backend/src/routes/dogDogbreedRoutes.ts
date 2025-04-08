/**
 * @swagger
 * /dog-dogbreeds:
 *   post:
 *     summary: Create a new dog-breed association
 *     tags: [Dog Breeds]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DogDogbreedInput'
 *     responses:
 *       201:
 *         description: Created dog-breed association
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DogDogbreed'
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /dog-dogbreeds/{id}:
 *   put:
 *     summary: Update a dog-breed association
 *     tags: [Dog Breeds]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dog-Breed association ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DogDogbreedInput'
 *     responses:
 *       200:
 *         description: Updated dog-breed association
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DogDogbreed'
 *       404:
 *         description: Dog-breed association not found
 *       400:
 *         description: Invalid input
 */ 