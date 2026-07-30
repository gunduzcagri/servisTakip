import { Router, Request, Response } from "express";
import { cargoService } from "./cargo.service";
import { asyncHandler } from "../../common/middleware/error-handler";
import { authenticate, authorize } from "../../common/guards/auth.guard";
import { AppError } from "../../common/utils/app-error";
import { z } from "zod";

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/cargo/companies
 * @desc    Get list of cargo companies
 */
router.get(
  "/companies",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const companies = await cargoService.getCargoCompanies();
    res.json({ companies });
  })
);

/**
 * @route   GET /api/cargo/configs
 * @desc    Get all cargo configs
 */
router.get(
  "/configs",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const configs = await cargoService.getConfigs();
    res.json({ configs });
  })
);

/**
 * @route   GET /api/cargo/config/:company
 * @desc    Get cargo config by company
 */
router.get(
  "/config/:company",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const config = await cargoService.getConfig(req.params.company);
    res.json(config);
  })
);

/**
 * @route   POST /api/cargo/config/:company
 * @desc    Save cargo config
 */
router.post(
  "/config/:company",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const config = await cargoService.saveConfig(req.params.company, req.body);
    res.json(config);
  })
);

/**
 * @route   POST /api/cargo/shipments
 * @desc    Create cargo shipment
 */
router.post(
  "/shipments",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      company,
      serviceRecordId,
      invoiceId,
      senderName,
      senderPhone,
      senderAddress,
      senderCity,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientCity,
      packageCount,
      weight,
      dimensions,
      notes,
    } = req.body;

    if (!company || !recipientName || !recipientPhone || !recipientAddress || !recipientCity) {
      throw AppError.validation("company, recipientName, recipientPhone, recipientAddress, recipientCity gerekli");
    }

    const shipment = await cargoService.createShipment({
      company,
      serviceRecordId,
      invoiceId,
      senderName,
      senderPhone,
      senderAddress,
      senderCity,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientCity,
      packageCount,
      weight,
      dimensions,
      notes,
    });

    res.status(201).json(shipment);
  })
);

/**
 * @route   GET /api/cargo/shipments
 * @desc    List cargo shipments
 */
router.get(
  "/shipments",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const company = req.query.company as string | undefined;
    const status = req.query.status as string | undefined;

    const result = await cargoService.getShipments(page, limit, company, status);
    res.json(result);
  })
);

/**
 * @route   GET /api/cargo/shipments/:id
 * @desc    Get shipment by ID
 */
router.get(
  "/shipments/:id",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const shipment = await cargoService.getShipmentById(req.params.id);
    res.json(shipment);
  })
);

/**
 * @route   PUT /api/cargo/shipments/:id/status
 * @desc    Update shipment status
 */
router.put(
  "/shipments/:id/status",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const validStatuses = ["CREATED", "PICKED_UP", "IN_TRANSIT", "AT_DESTINATION", "DELIVERED", "RETURNED", "FAILED"];
    
    if (!status || !validStatuses.includes(status)) {
      throw AppError.validation("Gecersiz durum");
    }

    const shipment = await cargoService.updateStatus(req.params.id, status);
    res.json(shipment);
  })
);

/**
 * @route   POST /api/cargo/track
 * @desc    Track shipment with cargo company
 */
router.post(
  "/track",
  authorize("ADMIN", "TECHNICIAN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { company, trackingNumber } = req.body;

    if (!company || !trackingNumber) {
      throw AppError.validation("company ve trackingNumber gerekli");
    }

    const result = await cargoService.trackShipment(company, trackingNumber);
    res.json(result);
  })
);

/**
 * @route   DELETE /api/cargo/shipments/:id
 * @desc    Delete shipment
 */
router.delete(
  "/shipments/:id",
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    await cargoService.deleteShipment(req.params.id);
    res.json({ success: true });
  })
);

export default router;
