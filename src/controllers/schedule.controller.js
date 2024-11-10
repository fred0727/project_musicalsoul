import CRUD from '../utils/CRUD'
import query from '../db'

class ScheduleController extends CRUD {

    async readManyWithTeacherSchedule(req, res, next) {
        const { id } = req.query
        const schedule = await this.readMany(req, res, next)
        const teacherSchedule = await query('SELECT schedule_id FROM teachers_schedules WHERE teacher_id = ?', [id || req.session.user.id])
        res.send({
            data: {
                schedule,
                teacherSchedule: teacherSchedule.map(i => i.schedule_id)
            }
        })
    }

    async updateSchedule(req, res, next) {
        const newSchedule = req.body.schedule
        const teacherId = req.session.user.id
        try {
            // Delete current schedule
            await query('DELETE FROM teachers_schedules WHERE teacher_id = ?', [teacherId])
            for await (let id of newSchedule) {
                await query('INSERT INTO teachers_schedules (schedule_id, teacher_id) VALUES (?, ?)', [id, teacherId])
            }
            return res.send({
                message: 'Updated'
            })

        } catch (err) {
            next(err)
        }
    }
}

export default new ScheduleController({
    name: 'service',
    table: 'services',
    readMany: {
        query: 'SELECT * FROM schedules WHERE time > 6',
        search() {
            return ['']
        },
    }
})
