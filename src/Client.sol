pragma solidity >= 0.5.4 <= 0.7.0;

contract Clock {
    function setTimer(uint nSeconds) external { }
}

contract Client {

    address timer;
    uint counter;
    uint interval;
    bool sent;

    struct Info {
        uint id;
        bool sent;
        uint time;
        uint interval;
    }

    Info[] info;

    modifier checkOwnerAndAccept {
        require(msg.pubkey() == tvm.pubkey(), 100);
		tvm.accept();
		_;
	}

    function callTimer(uint nSeconds) external checkOwnerAndAccept {
        counter++;
        Clock(timer).setTimer.value(1e9)(nSeconds);
        interval = nSeconds;
        sent = true;
        info.push(Info(counter, sent, now, nSeconds));        
    }

    function onTimer() external {
        tvm.accept();
        sent = false;
        info.push(Info(counter, sent, now, interval));
        interval = 0;        
    }

    function setTimerAddress(address addr) external checkOwnerAndAccept {
	    timer = addr;
    }

    function getInfo() public view returns (Info[] _info) {
        _info = info;
    }

    function sendTransaction(address dest, uint128 value, bool bounce) public view checkOwnerAndAccept {
        require(value > 0 && value < address(this).balance, 101);
        dest.transfer(value, bounce, 0);
    }
}

