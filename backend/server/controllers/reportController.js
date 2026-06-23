import * as reportService from '../services/reportService.js';
import { parseMonthYear } from '../utils/validators.js';

export async function monthly(req, res, next) {
  try {
    const { month, year } = parseMonthYear(req.query);
    res.json(
      await reportService.generateMonthlyReport({
        month,
        year,
        centerId: req.query.centerId,
        user: req.user
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function exportMonthly(req, res, next) {
  try {
    const report = await reportService.saveMonthlyReport({ ...req.body, user: req.user });
    res.status(201).json({ message: 'Report metadata saved. PDF export can be attached here.', report });
  } catch (error) {
    next(error);
  }
}
