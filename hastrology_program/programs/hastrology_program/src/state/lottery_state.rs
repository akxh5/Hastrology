use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct LotteryState{
    // ----Config----
    pub authority: Pubkey,
    pub pot_vault: Pubkey,
    pub platform_wallet: Pubkey,
    pub platform_fee_bps: u16,
    pub ticket_price: u64,
    
    // ----Lottery State----
    pub winner: u64,
    pub current_lottery_id: u64,
    pub total_participants: u64,
    pub is_drawing: bool,
    pub lottery_endtime: i64,
    pub commit_slot: u64,

    // ----Bumps----
    pub lottery_state_bump: u8,
    pub pot_vault_bump: u8
}