use anchor_lang::prelude::*;

use crate::{
    constants::LOTTERY_STATE_SEED, errors::HashtrologyErrors, state::LotteryState
};

#[derive(Accounts)]
pub struct Reset<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [LOTTERY_STATE_SEED],
        bump = lottery_state.lottery_state_bump
    )]
    pub lottery_state: Account<'info, LotteryState>,

    pub system_program: Program<'info, System> 
}

impl<'info> Reset<'info> {
    pub fn reset_handle(
        &mut self,
    ) -> Result<()> {

        let lottery_state = &mut self.lottery_state;
        let clock = Clock::get()?;

        require!(
            clock.unix_timestamp >= lottery_state.lottery_endtime,
            HashtrologyErrors::LotteryNotOver
        );

        require!(
            lottery_state.total_participants == 0,
            HashtrologyErrors::CannotRolloverWithPlayers
        );

        lottery_state.winner = 0;
        lottery_state.total_participants = 0;
        lottery_state.current_lottery_id = lottery_state.current_lottery_id.checked_add(1).ok_or(HashtrologyErrors::Overflow)?;
        lottery_state.lottery_endtime = lottery_state.lottery_endtime.checked_add(100).ok_or(HashtrologyErrors::Overflow)?;
        lottery_state.is_drawing = false; 
        lottery_state.commit_slot = 0;

        

        msg!("Initialized...");
        
        Ok(())
    }
}