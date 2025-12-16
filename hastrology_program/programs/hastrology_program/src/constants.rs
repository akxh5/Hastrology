use anchor_lang::prelude::*;

#[constant]
pub const LOTTERY_STATE_SEED: &[u8] = b"lottery_state";

#[constant]
pub const POT_VAULT_SEED: &[u8] = b"pot_vault";

#[constant]
pub const USER_RECEIPT_SEED: &[u8] = b"user-receipt";

#[constant]
pub const USER_TICKET_SEED: &[u8] = b"user-ticket";

#[constant]
pub const PRIZE_VAULT_SEED: &[u8] = b"prize_vault";