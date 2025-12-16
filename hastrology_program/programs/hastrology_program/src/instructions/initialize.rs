use anchor_lang::prelude::*;

use crate::{
    constants::{LOTTERY_STATE_SEED, POT_VAULT_SEED}, 
    errors::HashtrologyErrors, 
    state::LotteryState
};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + LotteryState::INIT_SPACE,
        seeds = [LOTTERY_STATE_SEED],
        bump
    )]
    pub lottery_state: Account<'info, LotteryState>,

    /// CHECK: This is the PDA vault that will hold the SOL prize pot.
    #[account(
        init,
        payer = authority,
        space = 8,
        seeds = [POT_VAULT_SEED],
        bump 
    )] 
    pub pot_vault: AccountInfo<'info>,

    pub system_program: Program<'info, System> 
}

impl<'info> Initialize<'info> {
    pub fn initialize_handle(
        &mut self,
        platform_wallet_pubkey: Pubkey,
        ticket_price: u64,
        platform_fee_bps: u16,
        first_lottery_endtime: i64,
        bumps: &InitializeBumps
    ) -> Result<()> {

        require!(
            platform_fee_bps <= 10_000, 
            HashtrologyErrors::InvalidPlatformFee
        );
        
        require!(
            ticket_price > 0, 
            HashtrologyErrors::InvalidTicketPrice
        );

        self.lottery_state.set_inner(LotteryState { 
            authority: self.authority.key(), 
            pot_vault: self.pot_vault.key(), 
            platform_wallet: platform_wallet_pubkey, 
            // last_winner: Pubkey::default(), 
            winner: 0,
            platform_fee_bps, 
            ticket_price, 
            current_lottery_id: 1, 
            total_participants: 0, 
            is_drawing: false,
            lottery_endtime: first_lottery_endtime,
            commit_slot: 0,
            lottery_state_bump: bumps.lottery_state,
            pot_vault_bump: bumps.pot_vault
        });

        msg!("Initialized...");
        
        Ok(())
    }
}