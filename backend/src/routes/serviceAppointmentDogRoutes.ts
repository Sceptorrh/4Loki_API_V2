/**
 * @swagger
 * /service-appointment-dogs:
 *   post:
 *     summary: Create a new service for an appointment dog
 *     tags: [Service Appointment Dogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceAppointmentDogInput'
 *     responses:
 *       201:
 *         description: Created service appointment dog
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceAppointmentDog'
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /service-appointment-dogs/{id}:
 *   put:
 *     summary: Update a service for an appointment dog
 *     tags: [Service Appointment Dogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Service Appointment Dog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceAppointmentDogInput'
 *     responses:
 *       200:
 *         description: Updated service appointment dog
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceAppointmentDog'
 *       404:
 *         description: Service appointment dog not found
 *       400:
 *         description: Invalid input
 */ 