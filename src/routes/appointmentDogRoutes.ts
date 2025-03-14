/**
 * @swagger
 * /appointment-dogs:
 *   post:
 *     summary: Create a new appointment-dog association
 *     tags: [Appointment Dogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentDogInput'
 *     responses:
 *       201:
 *         description: Created appointment-dog association
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentDog'
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /appointment-dogs/{id}:
 *   put:
 *     summary: Update an appointment-dog association
 *     tags: [Appointment Dogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment-Dog association ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentDogInput'
 *     responses:
 *       200:
 *         description: Updated appointment-dog association
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentDog'
 *       404:
 *         description: Appointment-dog association not found
 *       400:
 *         description: Invalid input
 */ 