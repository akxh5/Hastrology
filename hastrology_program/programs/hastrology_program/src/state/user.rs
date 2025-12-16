use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserEntryReceipt {
    pub user: Pubkey,
    pub lottery_id: u64,
    pub ticket_number: u64 
}

#[account]
#[derive(InitSpace)]
pub struct UserTicket {
    pub user: Pubkey,
    pub lottery_id: u64,

    pub is_winner: bool, // default: false
    pub prize_amount: u64, // default: 0
    pub is_claimed: bool //default: false
}